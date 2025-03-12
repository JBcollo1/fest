# Flask API backend

Fetch data from db

API serves frontend


## structure
```
/back-api
│── /app                 
│   │── /admin
│   │   │── __init__.py               
│   │   │── routes.py               
│   │── /auth
│   │   │── __init__.py               
│   │   │── routes.py 
│   │── /main
│   │   │── __init__.py               
│   │   │── routes.py 
│   │── __init__.py
│   ├── models.py
│── .env
│── .flaskenv
│── .gitignore
│── app.py
│── config.py
│── README.md
│── requirements.txt
```
used Blueprints to seperate api logical components / group together similar functionality - reusability

## Q

Any user can create event || Only organisers create events


## setup
Install requirements

```
pip install -r requirements.txt
```

run flask api in dev mode on `http://127.0.0.1:5000`

```
flask run
```

### Routes
| HTTP Method | HTTP Method | Notes                  |
| ----------- | ----------- | ---------------------  |
| GET         | /api        | Main blueprint routes  |
| GET         | /api/auth   | Auth blueprint routes  |
| GET         | /api/admin  | admin blueprint routes |