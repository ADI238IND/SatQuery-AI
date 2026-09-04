from .change_detection import ChangeDetector

class ChangeSpecialist:
    def __init__(self, checkpoint_path, threshold=None, device=None):
        self.detector = ChangeDetector(checkpoint_path, threshold, device)

    def analyze(self, before, after, query=""):
        res = self.detector.detect(before, after)
        if query: res["query"] = query
        return res

# Functional API for convenience
_detector = None

def load_change_detector(checkpoint_path, threshold=None, device=None):
    global _detector
    _detector = ChangeDetector(checkpoint_path, threshold, device)
    return _detector

def analyze_change(before, after):
    if _detector is None:
        raise RuntimeError("Change detector not initialized. Call load_change_detector first.")
    return _detector.detect(before, after)
