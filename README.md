# Andhra Circle (JNTU Circle)

Full-stack academic platform for engineering students providing syllabus references, semester SGPA calculators, unit & textbook notes, lab programs, previous examination papers, and university notifications.

## Project Structure
- `andhra-circle-frontend/`: React + Vite single page application.
- `andhra-circle-backend/`: Node.js Express API server with MongoDB Mongoose ODM.
- `andhra-circle-landing/`: Landing page web experience.

## Database Information
- **Active Database**: **Local MongoDB** (viewable in MongoDB Compass)
  - **Database Name**: `andhra-circle`
  - **Host**: `127.0.0.1:27017`
  - **Storage Note**: All data lives strictly on this computer. It is not backed up to Atlas or any remote server unless you run the local backup command:
    ```bash
    node andhra-circle-backend/scripts/backup-db.js
    ```

Refer to [andhra-circle-backend/README.md](file:///c:/Users/nnaga/OneDrive/Desktop/New-project/andhra-circle-backend/README.md) for detailed health endpoints, index maintenance, and backup procedures.
