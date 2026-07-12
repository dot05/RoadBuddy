# RoadBuddy 🚗
**AI-Powered Road Trip Planner for India**

RoadBuddy is a modern, unified web platform designed to help travellers in India plan and manage road trips end-to-end. It features AI-generated day-by-day itineraries, fuel and toll cost calculations, route safety assessments, community route sharing, personal trip journals with summaries, and an integrated travel marketplace supporting transit bookings (bus, train, flight, hotel) and a partner-run cab/vehicle provider fleet.

---

## Architectural Overview

RoadBuddy is built as a **monolithic unified architecture** where a single FastAPI service handles both the business logic REST APIs and compiles and renders the traveler/partner Jinja2 HTML page templates.

```
+-------------------------------------------------------------+
|                     ROADBUDDY APPLICATION                   |
|                          (Port 8000)                        |
|                                                             |
|   +-----------------------+       +---------------------+   |
|   |   JINJA2 TEMPLATES    | <===> |    REST API LAYER   |   |
|   | (Traveler & Provider) |       | (FastAPI Routers)   |   |
|   +-----------------------+       +---------------------+   |
|               ^                               ^             |
|               |                               |             |
|               v                               v             |
|   +-----------------------------------------------------+   |
|   |         SQLAlchemy ORM + SQLite / PostgreSQL        |   |
|   +-----------------------------------------------------+   |
+-------------------------------------------------------------+
```

### Key Architectural Features:
1. **Unified Service**: Both traveler-facing pages (explore, planner, dashboard) and provider portals (dispatch cockpit, dhaba order desk) are served from port 8000.
2. **Interactive Mapping**: Leverages Leaflet.js maps along with OSRM routing corridors for coordinates capture, POI overlays (dhaba marker pins, hotel queries), and simulated navigation.
3. **Robust Auth & Security**: Separate traveler and provider sessions are managed via HttpOnly JWT tokens with automatic fallback and cookie reading.

---

## Tech Stack

| Component | Technology | Status |
|---|---|---|
| **Server Engine** | FastAPI (Python 3.10+) running on port 8000 | ✅ **Fully Operational** |
| **Styling & Presentation** | Vanilla CSS + Tailwind CSS (dynamic grids, glassmorphism, responsive cockpits) | ✅ **Available** |
| **Interactive Mapping** | Leaflet.js (OSRM Routing Engine + Overpass POI queries) | ✅ **Available** |
| **Database & ORM** | SQLAlchemy ORM with SQLite (development) and PostgreSQL compatibility | ✅ **Available** |
| **Authentication** | JWT (python-jose) + bcrypt hashing (secured **HttpOnly** cookies: `roadbuddy_token` and `access_token`) | ✅ **Available** |
| **AI Processing** | Groq API (Llama-3.1 models) with fallback to Gemini API | ✅ **Available** |
| **Email Dispatch** | SMTP-based Brevo API for OTP verification | ✅ **Available** |

---

## Core Features & Modules

### 1. AI-Powered Trip Planning & Custom Itineraries
- **Itinerary Generator** (`POST /api/trips/generate`): Generates custom day-by-day plans specifying stops, estimated budgets, and travel tips tailored to season, group composition, and budget tier.
- **Vehicle-Aware Costs**: Itinerary generation integrates vehicle-specific specifications (category, fuel type, mileage/KMPL) to dynamically calculate realistic fuel costs (Petrol, Diesel, CNG, or Electric charging rates) and toll rates.
- **Day & Night 4-Slot Timeline**: Plans are divided into 4 slots per day: `morning`, `afternoon`, `evening`, and `night`.
- **Route Safety Checks**: Evaluates route safety profiles, flags terrain hazards, and assigns a safety score based on weather or seasonal conditions.
- **Conversational Chatbot**: An interactive chatbot helper residing in the dashboard for real-time travel planning suggestions.

### 2. Intelligent Mapping & Navigation (Telemetry & Live GPS)
- **Google Maps-style navigation HUD**: Integrates compass widgets, cardinal telemetry bearings, turn-by-turn instruction boxes, and a pulse user location arrow.
- **Highway Partner Dhabas on Maps**: Food provider restaurants are plotted automatically as green markers with gold stars (`🌟`) and calculated geodesic distance from the traveler's active location.

### 3. Traveler Garage & Vehicle Profiles
- Travelers register personal vehicles to compute fuel efficiency and custom ranges. Supports dynamic deletion using AJAX.

### 4. Cab Services & Provider Marketplace
- **Fleet Configurations**: Fleet vehicles are separated into Private Cabs (billed per km) and Fixed-Fare Cabs (routes).
- **Multi-seat Bookings**: Multi-seat booking modal featuring passenger name/age registration forms stored as serialized JSON.

---

## Project Structure

```
RoadBuddy/
├── backend/                             # FastAPI Application root directory
│   ├── app/
│   │   ├── main.py                      # FastAPI initialization, routers, CORS and custom exception handlers
│   │   ├── core/                        # Config, database connections, JWT auth, and OTP utils
│   │   │   ├── auth.py                  # Rider session authentication handlers
│   │   │   ├── config.py                # Environment configuration settings
│   │   │   └── database.py              # DB Engine & session generator
│   │   ├── models/
│   │   │   └── models.py                # Database declarations (SQLAlchemy models)
│   │   ├── schemas/
│   │   │   ├── schemas.py               # Pydantic schemas for core entities
│   │   │   └── booking_schemas.py       # Pydantic schemas for transit bookings
│   │   ├── provider/                    # Provider marketplace engine
│   │   │   ├── router.py                # Provider endpoints (Fleet CRUD, Setup, telemetry)
│   │   │   ├── pages.py                 # Provider portal UI controllers
│   │   │   └── food_pages.py            # Food Provider UI controllers
│   │   ├── routers/                     # Traveler JSON API endpoints (trips, users, fuel, journals)
│   │   └── services/                    # AI services, Groq clients, and fuel calculators
│   ├── templates/                       # Jinja2 views styled with Tailwind and style.css
│   │   ├── 404.html                     # Custom 404 Not Found Page
│   │   ├── 500.html                     # Custom 500 Server Error Page
│   │   └── ...                          # Traveler & Provider dashboard templates
│   ├── static/                          # Custom stylesheets and graphics (style.css, provider.css)
│   ├── tests/                           # Pytest suite
│   ├── seed_data.py                     # Mock transit schedules data seeding script
│   ├── seed_restaurants.py              # Mock restaurants & menu items seeding script
│   └── requirements.txt                 # Backend package requirements
├── docs/                                # Documentation assets
├── .gitignore                           # Exclusions database files, IDE settings, and build caches
└── README.md                            # Comprehensive project guide
```

---

## Database Models

The schema uses SQLAlchemy to link entities:
- `User`: Traveler logins, vehicles list, active bookings.
- `Vehicle`: Personal vehicle specifications in traveler garages.
- `Provider`: Partner businesses, contacts, city, service profiles.
- `ProviderVehicle`: Active vehicle listings deployed for private hire or routes.
- `ProviderBooking`: Fleet reservations containing traveler schedules and occupant rosters.
- `Trip` & `TripStop`: Saved itineraries and day plans.
- `CommunityRoute` & `RouteReview`: Public route-sharing hub entries.
- `Journal` & `JournalEntry`: Traveler expense sheets and daily diaries.
- `HotelBooking`, `TrainBooking`, `BusBooking`, `FlightBooking`: Core transit tickets.
- `Restaurant`, `MenuItem`, `FoodOrder`, `FoodReview`: Partner dhabas and food catalog system.

---

## API Endpoints Matrix

| Router | Method | Path | Description | Authorization |
|---|---|---|---|---|
| **Users** | `POST` | `/api/users/register` | Register traveler | None |
| **Users** | `POST` | `/api/users/login` | Login traveler & fetch JWT | None |
| **Users** | `GET` | `/api/users/me` | Fetch traveler profile | Bearer Token |
| **Users** | `GET` | `/api/users/vehicles` | List traveler vehicles | Bearer Token |
| **Users** | `DELETE`| `/api/users/vehicles/{vehicle_id}` | Delete a personal vehicle | Bearer Token |
| **Trips** | `POST` | `/api/trips/generate` | Generate AI itinerary | Bearer Token |
| **Trips** | `POST` | `/api/trips/waypoints` | Fetch waypoint recommendations | None |
| **Trips** | `POST` | `/api/trips/safety-check` | Run AI route safety analysis | None |
| **Trips** | `POST` | `/api/trips/chat` | AI trip planning chat thread | None |
| **Fuel** | `POST` | `/api/fuel/calculate` | Calculate fuel & toll estimates | None |
| **Community**| `POST` | `/api/community/publish` | Publish a travel route | Bearer Token |
| **Community**| `GET` | `/api/community/search` | Natural-language route search | None |
| **Provider** | `POST` | `/api/provider/register` | Register a partner account | None |
| **Provider** | `POST` | `/api/provider/login` | Login partner & fetch JWT | None |
| **Provider** | `PATCH`| `/api/provider/me` | Update company config & alternate email | Provider Token |
| **Provider** | `GET` | `/api/provider/services` | Query available cab services | None |
| **Provider** | `GET` | `/api/provider/bookings/user`| Fetch unread alert states for travelers | Bearer Token |
| **Provider** | `POST` | `/api/provider/bookings/{id}/start-nav`| Start telemetry dispatch mapping | Provider Token |
| **Provider** | `POST` | `/api/provider/bookings/{id}/location`| Sync driver coordinates | Provider Token |
| **Food** | `GET` | `/api/food/restaurants` | Fetch seeded dhabas along cities | None |
| **Food** | `GET` | `/api/food/restaurants/{id}/menu` | List menu items | None |
| **Food** | `POST` | `/api/food/order` | Place prepaid meal order | Bearer Token |
| **Food** | `GET` | `/api/food/my-orders` | Fetch traveler order history | Bearer Token |

---

## Web Pages (Jinja2 Templates - Port 8000)

- **Traveler Dashboard & Planning**:
  - `/` : Landing explore page.
  - `/login`, `/register`, `/verify-otp` : Authentication pages.
  - `/dashboard` : Widgets pane linking chatbots, recommendations, and routes.
  - `/plan-trip` : Route maps, waypoint recommendations, itinerary builders.
  - `/vehicles` : Vehicle garage (Add / Remove).
  - `/bookings` : Bookings catalog supporting hotels, transit, and cabs network search.
  - `/my-bookings` : Traveler reservations drawer showing ticket details.
  - `/settings` : Profile edit forms.
  - `/start-trip` : Live maps HUD dashboard with compass tracking and dhaba indicators.
- **Provider Dashboard Cockpit**:
  - `/provider/register`, `/provider/login` : Credentials validation.
  - `/provider/dashboard` : Live metrics, onboarding setup banners, revenue panels.
  - `/provider/vehicles` : Listing registers supporting route schedules and asset inventories.
  - `/provider/bookings` : Bookings manager with per-seat passenger list and live GPS coordinate sync.
  - `/provider/settings` : Partner company metadata updating.
  - `/food-provider/` : Onboarding setups, menu listings, order registers, and preparation timings for dhabas.

---

## Recent Gaps & User-Friendliness Audit Fixes

A series of updates have been made to resolve performance and security gaps identified during the code audit:
*   **Restored Partner Dashboard:** Fixed a JavaScript bracket syntax error in `provider_base.html` that disabled the entire sidebar and modals.
*   **HttpOnly Cookie Sessions:** Modified all user, provider, and food provider cookies to be set as `HttpOnly`, preventing client-side script token hijacking.
*   **Loading spin animations:** Added submission loaders and disabled click states on login, registration, OTP validation, and password resets.
*   **Password Complexity:** Implemented minimum 8 character constraints on all registrations and forgot-password forms.
*   **Resend OTP Cooldown:** Added a "Resend OTP" option with a 60-second cooldown timer.
*   **User Profile Verification:** Requires current password validation before allowing traveler details updates.
*   **Interactive Dashboard Cards:** wrapped trip cards inside links redirecting directly to itineraries.
*   **Custom HTML Error Pages:** Added custom styling for 404 (Not Found) and 500 (Server Error) page rendering.
*   **Image Compression:** Compressed the main dashboard background from 2.3 MB down to 260 KB WebP.

---

## Local Execution Guide

### 1. Launch the Unified Service
1. Navigate to the backend directory:
   ```bash
   cd RoadBuddy/backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   venv\Scripts\activate        # On Windows
   # source venv/bin/activate   # On macOS/Linux
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Setup environment variables by copying `.env.example` to `.env` in the `backend/` folder and filling in your API keys (e.g. `GROQ_API_KEY`, `GEMINI_API_KEY`).
5. Seed initial mock records:
   ```bash
   python seed_data.py
   python seed_restaurants.py
   ```
6. Spin up the FastAPI web server:
   ```bash
   uvicorn app.main:app --port 8000 --reload
   ```

### 2. Access URLs
- **Web App & Dashboards**: [http://localhost:8000/](http://localhost:8000/)
- **Interactive REST API Reference**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Pytest Verification**:
  ```bash
  $env:PYTHONPATH="."; pytest
  ```