import pytest
from app.models.models import Provider, ProviderVehicle, VehicleReview, User
from app.core.auth import create_access_token
from app.provider.auth import hash_password

@pytest.fixture
def auth_headers(db_session):
    # Ensure there is a user
    user = db_session.query(User).filter(User.email == "tester@roadbuddy.com").first()
    if not user:
        user = User(
            name="Test User",
            email="tester@roadbuddy.com",
            password_hash=hash_password("password")
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
    token = create_access_token({"sub": str(user.id)})
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def seed_test_vehicle(db_session):
    # Create a provider first
    provider = Provider(
        email="test_prov_veh@roadbuddy.com",
        password_hash="fake",
        service_type="cab",
        company_name="Test Provider Corp"
    )
    db_session.add(provider)
    db_session.commit()
    db_session.refresh(provider)

    vehicle = ProviderVehicle(
        provider_id=provider.id,
        vehicle_type="sedan",
        vehicle_name="Dzire Test",
        driver_included=True,
        origin="Jaipur",
        destination="Delhi",
        departure_time="08:00",
        fixed_fare_inr=3000.0,
        total_seats=4,
        seats_booked=0,
        is_active=True,
        avg_rating=0.0,
        total_reviews=0
    )
    db_session.add(vehicle)
    db_session.commit()
    db_session.refresh(vehicle)
    return vehicle

def test_vehicle_reviews_flow(client, db_session, auth_headers, seed_test_vehicle):
    vehicle_id = seed_test_vehicle.id
    
    # 1. Post a review
    review_data = {"rating": 5, "review_text": "Clean vehicle and polite driver!"}
    res = client.post(f"/api/provider/vehicles/{vehicle_id}/reviews", json=review_data, headers=auth_headers)
    assert res.status_code == 201
    res_data = res.json()
    assert res_data["status"] == "success"
    assert res_data["avg_rating"] == 5.0
    assert res_data["total_reviews"] == 1
    
    # 2. Post a second review
    review_data_2 = {"rating": 4, "review_text": "Good ride, slightly delayed."}
    res2 = client.post(f"/api/provider/vehicles/{vehicle_id}/reviews", json=review_data_2, headers=auth_headers)
    assert res2.status_code == 201
    assert res2.json()["avg_rating"] == 4.5
    assert res2.json()["total_reviews"] == 2
    
    # 3. Retrieve reviews list
    res_list = client.get(f"/api/provider/vehicles/{vehicle_id}/reviews", headers=auth_headers)
    assert res_list.status_code == 200
    reviews = res_list.json()
    assert len(reviews) == 2
    assert reviews[0]["rating"] == 4
    assert reviews[0]["review_text"] == "Good ride, slightly delayed."
    assert reviews[0]["user_name"] == "Test User"
    assert reviews[1]["rating"] == 5
    
    # 4. Verify list cab services endpoint returns review statistics
    res_services = client.get(f"/api/provider/services?origin=Jaipur&destination=Delhi", headers=auth_headers)
    assert res_services.status_code == 200
    services = res_services.json()
    found_vehicle = next((s for s in services if s["id"] == vehicle_id), None)
    assert found_vehicle is not None
    assert found_vehicle["avg_rating"] == 4.5
    assert found_vehicle["total_reviews"] == 2
