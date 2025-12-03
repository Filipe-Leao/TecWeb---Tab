# TecWeb – Tab

## How to run

### 1) Prerequisites

You need to have the database running locally.

#### 1.1 — Install XAMPP (any OS)

[https://www.apachefriends.org/download.html](https://www.apachefriends.org/download.html)

#### 1.2 — Start services

Open **XAMPP Control Panel**
start:

* Apache
* MySQL

Then open MySQL Admin.

#### 1.3 — Import the database

Import `tab_db.sql`.

> *(If you already imported it before, you can skip this step.)*

#### 1.4 — Have Node + npm installed

Make sure npm is available on your machine.

Install required npm modules

```bash
npm i express mysql2 cors bcrypt
```

---

### 2) Run the project

Inside this project’s root (same folder as `index.js`) run:

```bash
npm run dev
```

Then open:
[http://localhost:3000](http://localhost:3000)