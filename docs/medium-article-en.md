# I Built an AI Travel Map with Claude + Mapbox — Because No Tool Did What I Needed

I'm someone who loves tracking travel, but I could never find a single tool that let me pin visited places, manage a wishlist, and automatically plan itineraries from my saved destinations.

Pinfarer was built to solve exactly that.

## The Core: A Three-State Pin System

Every location can be marked with one of three statuses:
- **Visited** — places I've actually been
- **Watchlist** — destinations I'm actively planning
- **Dream** — things I've bookmarked without a concrete plan

These three states map to how travelers actually think — not just "saved / not saved."

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Map | Mapbox GL JS (globe projection) |
| Database | Supabase (PostgreSQL + JSONB) |
| AI | Anthropic Claude Sonnet 4.6 |
| Images | Pixabay API |
| Deployment | Vercel |

## Globe Projection

I originally planned to use a standard flat map, but Mapbox supports true Globe Projection — a real spherical Earth.

For a travel product, this was an easy call. When you pin a location and watch the globe rotate and fly to it, the interaction itself is exciting. It changes how the product *feels*.

## AI Trip Planner

This was the most time-intensive feature, and the most valuable one.

Users can:
1. Select destinations from their saved pins
2. Set trip length (3–14 days), travel style, and preference tags
3. Claude generates a day-by-day itinerary with timed activities
4. A live Mapbox map shows the selected pins and dashed route line

The key prompt design insight: Claude knows which places the user has already saved (meaning genuine interest), combined with travel preferences. The result is a personalized itinerary, not a generic "Top 10 tourist spots" list.

## KML Import

Many users already have hundreds of saved places in Google Maps. I added direct Google Takeout KML import — parse all location data, preview before import, then bulk-add in one click.

This turns Pinfarer from "start from scratch" into "a new home for your existing travel data."

## Place Detail Pages

Each place has two data modes:

**City data**: population, language, currency, climate, food culture, visa info, safety rating, notable animals

**Property data** (for users considering relocation): school catchment, transport score, CBD distance, median price range

All generated in real time by Claude, with Pixabay photos as visual context.

## What I Learned

Building Pinfarer taught me a lot about real-time AI integration at the UX layer — specifically, how to make AI feel like a natural part of the product flow rather than a bolted-on feature.

The globe map taught me that visual decisions matter as much as technical ones. The right rendering choice can change the entire emotional experience of using an app.

And the KML import taught me: meet users where their data already lives.
