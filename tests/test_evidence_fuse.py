from satquery.evidence_fuse import fuse_evidence
from satquery.types import Evidence


def test_good_evidence_is_accepted():
    result = fuse_evidence([
        Evidence(
            specialist="change",
            claim="New construction detected",
            confidence=0.9,
            sensor_quality=0.9,
            grounding_score=0.9,
            agreement_score=0.9,
            registration_quality=0.95,
        )
    ])
    assert not result.abstained
    assert result.confidence >= 0.60


def test_weak_evidence_abstains():
    result = fuse_evidence([
        Evidence(
            specialist="vqa",
            claim="Flooding present",
            confidence=0.25,
            sensor_quality=0.20,
            grounding_score=0.20,
            agreement_score=0.25,
            registration_quality=0.50,
            domain_shift_score=0.8,
        )
    ])
    assert result.abstained
