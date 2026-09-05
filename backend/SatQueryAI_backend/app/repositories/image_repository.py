from typing import Any, Dict, List, Optional
from app.core.config import settings
from app.core.logging import get_logger
from app.integrations.supabase import get_supabase_client
from app.schemas.image import ImageResponseData

logger = get_logger(__name__)


class ImageRepository:
    """
    Repository for persisting and retrieving satellite imagery metadata.
    Strictly aligns with the Supabase `satellite_images` table schema.
    """

    def __init__(self):
        self._memory_store: Dict[str, ImageResponseData] = {}
        self.table_name = getattr(settings, "SUPABASE_TABLE_NAME", "satellite_images")

    def _to_db_payload(self, image_data: ImageResponseData) -> Dict[str, Any]:
        """
        Formats image data into the exact columns of the `satellite_images` table:
        image_id, file_name, storage_path, file_type, file_size, source,
        capture_date, latitude, longitude, resolution_m, metadata, created_at.
        """
        return {
            "image_id": image_data.image_id,
            "file_name": image_data.file_name,
            "storage_path": image_data.storage_path,
            "file_type": image_data.file_type,
            "file_size": image_data.file_size,
            "source": image_data.source,
            "capture_date": image_data.capture_date.isoformat() if image_data.capture_date else None,
            "latitude": image_data.latitude,
            "longitude": image_data.longitude,
            "resolution_m": image_data.resolution_m,
            "metadata": image_data.metadata or {},
            "created_at": image_data.created_at.isoformat(),
        }

    def save(self, image_data: ImageResponseData) -> ImageResponseData:
        """Persists satellite image metadata to cache and Supabase table `satellite_images`."""
        # Always update in-memory cache
        self._memory_store[image_data.image_id] = image_data

        client = get_supabase_client()
        if client:
            try:
                db_payload = self._to_db_payload(image_data)
                client.table(self.table_name).upsert(db_payload).execute()
                logger.info(f"Saved satellite image record {image_data.image_id} to Supabase table '{self.table_name}'.")
            except Exception as e:
                logger.warning(
                    f"Could not persist image record {image_data.image_id} to Supabase table '{self.table_name}': {e}. "
                    "Data remains available in memory cache."
                )

        return image_data

    def get_by_id(self, image_id: str) -> Optional[ImageResponseData]:
        """Retrieves image metadata by image_id from cache or Supabase `satellite_images` table."""
        if image_id in self._memory_store:
            return self._memory_store[image_id]

        client = get_supabase_client()
        if client:
            try:
                response = (
                    client.table(self.table_name)
                    .select("*")
                    .eq("image_id", image_id)
                    .limit(1)
                    .execute()
                )
                if response.data and len(response.data) > 0:
                    record = ImageResponseData.model_validate(response.data[0])
                    self._memory_store[image_id] = record
                    return record
            except Exception as e:
                logger.warning(f"Error querying Supabase table '{self.table_name}' for image {image_id}: {e}")

        return None

    def list_all(self, limit: int = 50, offset: int = 0) -> List[ImageResponseData]:
        """Lists images with pagination from Supabase `satellite_images` or cache."""
        client = get_supabase_client()
        if client:
            try:
                response = (
                    client.table(self.table_name)
                    .select("*")
                    .order("created_at", desc=True)
                    .range(offset, offset + limit - 1)
                    .execute()
                )
                if response.data:
                    records = [ImageResponseData.model_validate(item) for item in response.data]
                    for r in records:
                        self._memory_store[r.image_id] = r
                    return records
            except Exception as e:
                logger.warning(f"Error querying Supabase table '{self.table_name}' list: {e}")

        all_images = list(self._memory_store.values())
        all_images.sort(key=lambda img: img.created_at, reverse=True)
        return all_images[offset : offset + limit]

    def count(self) -> int:
        """Returns total count of stored image records."""
        return len(self._memory_store)

    def delete(self, image_id: str) -> bool:
        """Deletes an image metadata record by image_id from cache and Supabase."""
        existed = self._memory_store.pop(image_id, None) is not None

        client = get_supabase_client()
        if client:
            try:
                client.table(self.table_name).delete().eq("image_id", image_id).execute()
            except Exception as e:
                logger.warning(f"Error deleting image {image_id} from Supabase table '{self.table_name}': {e}")

        return existed

    def download_image_bytes(self, storage_path: str) -> Optional[bytes]:
        """
        Downloads actual image binary from Supabase Storage using the storage_path
        stored in the satellite_images table.

        The storage_path format is: 'bucket_name/object_path'
        (e.g. 'satellite-images/uploads/abc123_scene.tif').

        Uses the authenticated Supabase client (service-role key) so private
        buckets remain private. No secret keys are exposed.

        Returns raw image bytes on success, or None if download fails.
        """
        client = get_supabase_client()
        if not client:
            logger.warning(
                "Supabase client is not available. Cannot download image from storage."
            )
            return None

        try:
            # storage_path format: "bucket_name/object_path"
            # Split into bucket and the remaining object path
            parts = storage_path.split("/", 1)
            if len(parts) != 2:
                logger.error(
                    f"Invalid storage_path format '{storage_path}'. "
                    "Expected 'bucket_name/object_path'."
                )
                return None

            bucket_name, object_path = parts

            response = client.storage.from_(bucket_name).download(object_path)
            if response and len(response) > 0:
                logger.info(
                    f"Downloaded {len(response)} bytes from "
                    f"Supabase Storage: {storage_path}"
                )
                return response

            logger.warning(f"Empty response downloading '{storage_path}' from Supabase Storage.")
            return None

        except Exception as e:
            logger.error(f"Failed to download image from Supabase Storage '{storage_path}': {e}")
            return None


# Global singleton instance
image_repository = ImageRepository()

