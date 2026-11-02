# Lost & Found – Campus Connect

A single full-stack Lost & Found website built around the MITAOE Web Technology syllabus:
HTML, CSS, Bootstrap, JavaScript, ReactJS, NodeJS, ExpressJS, REST APIs and MongoDB.

## Features
- Browse and search lost/found reports
- Filter by Lost or Found
- Submit a lost/found report
- View report details
- Update report status
- Delete reports
- Responsive Bootstrap interface
- Express REST API with server-side validation
- MongoDB persistence

> This is an academic starter project. The admin controls are intentionally simple and are not protected by authentication. Add authentication and authorization before using it with real users.

## Requirements
- Node.js 18+
- MongoDB Community Server or MongoDB Atlas connection string

## Setup
1. Extract the ZIP.
2. Open a terminal in the extracted `lost-and-found` folder.
3. Install dependencies:
   ```bash
   npm run install:all
   ```
4. Create `server/.env` by copying `server/.env.example`.
5. Set `MONGO_URI` to your MongoDB connection string.
6. Start both frontend and backend:
   ```bash
   npm run dev
   ```
7. Open http://localhost:5173

Backend runs at http://localhost:5000. Health check: http://localhost:5000/api/health

## API endpoints
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/items` | List reports; supports `?type=Lost&q=wallet` |
| GET | `/api/items/:id` | Get one report |
| POST | `/api/items` | Create report |
| PUT | `/api/items/:id` | Update report |
| PATCH | `/api/items/:id/status` | Update status |
| DELETE | `/api/items/:id` | Delete report |

Test these endpoints with Postman. Example POST body:
```json
{
  "itemName": "Black wallet",
  "type": "Lost",
  "category": "Accessories",
  "description": "Black leather wallet with cards.",
  "location": "Central Library",
  "date": "2026-10-29",
  "contact": "student@example.com"
}
```

## Practical mapping
1. HTML/CSS/Bootstrap: `client/index.html`, `client/src/index.css`, Bootstrap UI
2. JavaScript: form validation, filtering, arrays and JSON API payloads
3. ReactJS: components, state, events and client-side validation
4. NodeJS: `server/server.js`
5. ExpressJS: `server/routes/items.js`
6. REST API: `/api/items` endpoints, test with Postman
7. MongoDB: `server/models/Item.js`

## Notes
- If MongoDB is unavailable, the server will report a connection error. Start MongoDB or correct `MONGO_URI`.
- This version stores image URLs rather than uploading image files, keeping the project focused on the listed syllabus technologies.
