"""Tests for DELETE /voyages/{id} and DELETE /reconciliations/{id} endpoints."""

from fastapi.testclient import TestClient

from keel_api.main import app
from keel_api.store import save_voyage, delete_voyage, load_voyage

client = TestClient(app)


def _seed_voyage(voyage_id: str = "voyage_test_delete") -> None:
    """Insert a test voyage into the store."""
    save_voyage(
        voyage_id,
        {
            "status": "Reconciled",
            "owner_name": "Test Owner",
            "frontend": {
                "charterparty": {"vessel_name": "MV Test Ship"},
                "owner_calculation": {"total_usd": 100000},
                "charterer_calculation": {"total_usd": 50000},
                "reconciled_total_usd": 75000,
                "day_verdicts": [],
            },
        },
        owner_name="Test Owner",
    )


class TestDeleteVoyage:
    def test_delete_existing_voyage(self):
        voyage_id = "voyage_delete_existing"
        _seed_voyage(voyage_id)

        # Verify it exists
        assert load_voyage(voyage_id) is not None

        # Delete it
        response = client.delete(f"/voyages/{voyage_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["voyage_id"] == voyage_id
        assert data["status"] == "deleted"

        # Verify it's gone
        assert load_voyage(voyage_id) is None

    def test_delete_nonexistent_voyage(self):
        response = client.delete("/voyages/voyage_nonexistent_12345")
        assert response.status_code == 404
        data = response.json()
        assert "not found" in data["detail"].lower()

    def test_delete_voyage_appears_in_list_before(self):
        voyage_id = "voyage_delete_list_check"
        _seed_voyage(voyage_id)

        # Verify it appears in the list
        response = client.get("/voyages")
        assert response.status_code == 200
        voyages = response.json()
        voyage_ids = [v["voyage_id"] for v in voyages]
        assert voyage_id in voyage_ids

        # Delete it
        client.delete(f"/voyages/{voyage_id}")

        # Verify it no longer appears in the list
        response = client.get("/voyages")
        assert response.status_code == 200
        voyages = response.json()
        voyage_ids = [v["voyage_id"] for v in voyages]
        assert voyage_id not in voyage_ids

    def test_delete_multiple_voyages(self):
        ids = ["voyage_del_multi_1", "voyage_del_multi_2", "voyage_del_multi_3"]
        for vid in ids:
            _seed_voyage(vid)

        # Delete each one
        for vid in ids:
            response = client.delete(f"/voyages/{vid}")
            assert response.status_code == 200

        # Verify all are gone
        for vid in ids:
            assert load_voyage(vid) is None


class TestDeleteReconciliation:
    def test_delete_existing_reconciliation(self):
        voyage_id = "voyage_delete_reconcile"
        _seed_voyage(voyage_id)

        # Delete via reconciliations endpoint
        response = client.delete(f"/reconciliations/{voyage_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["voyage_id"] == voyage_id
        assert data["status"] == "deleted"

        # Verify it's gone from voyages too
        assert load_voyage(voyage_id) is None

    def test_delete_nonexistent_reconciliation(self):
        response = client.delete("/reconciliations/voyage_nonexistent_reconcile")
        assert response.status_code == 404

    def test_delete_reconciliation_appears_in_list_before(self):
        voyage_id = "voyage_delete_reconcile_list"
        _seed_voyage(voyage_id)

        # Verify it appears in reconciliations list
        response = client.get("/reconciliations")
        assert response.status_code == 200
        items = response.json()["items"]
        item_ids = [item["voyage_id"] for item in items]
        assert voyage_id in item_ids

        # Delete it
        client.delete(f"/reconciliations/{voyage_id}")

        # Verify it no longer appears
        response = client.get("/reconciliations")
        assert response.status_code == 200
        items = response.json()["items"]
        item_ids = [item["voyage_id"] for item in items]
        assert voyage_id not in item_ids
