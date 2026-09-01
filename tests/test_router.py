from satquery.routing import route_query
from satquery.types import Task


def test_change_measurement_route():
    decision = route_query(
        "How much area changed between these two dates?",
        image_count=2,
        modalities=["optical", "optical"],
    )
    assert Task.BITEMPORAL_CHANGE in decision.tasks
    assert Task.GIS_MEASUREMENT in decision.tasks


def test_optical_sar_route():
    decision = route_query(
        "Use SAR to verify the cloudy optical image",
        image_count=2,
        modalities=["optical", "sar"],
    )
    assert Task.OPTICAL_SAR in decision.tasks
