# AI-vs-AfD

Faktencheck Feed für AfD Aussagen auf Bundes- und Landesebene.

## Konzept

- **Feed:** Links Original-Aussage, Rechts Faktencheck mit Quellen
- **Keine Likes/Kommentare** — nur Fakten
- **Automatisiert:** Fetcher sammelt Beiträge, AI analysiert und sucht Quellen

## Tech Stack

- **Backend:** Node.js (Fetcher + API)
- **Frontend:** Vanilla HTML/CSS/JS (einfach, schnell)
- **Browser:** Headless Chrome/Chromium für Scraping
- **Daten:** JSON-Files (erstmal simpel)

## Segmente

### Bundesebene
- AfD Bundespartei Website
- Twitter/X Accounts (Bundestagsfraktion)
- Pressemitteilungen

### Landesebene
- Baden-Württemberg, Bayern, Berlin, Brandenburg, Bremen, Hamburg, Hessen, Mecklenburg-Vorpommern, Niedersachsen, Nordrhein-Westfalen, Rheinland-Pfalz, Saarland, Sachsen, Sachsen-Anhalt, Schleswig-Holstein, Thüringen

## Status

- [ ] Headless Browser Setup
- [ ] Fetcher für AfD Quellen
- [ ] Quellen-Datenbank
- [ ] Frontend Feed
- [ ] CI/CD Pipeline
