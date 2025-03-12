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
│── .gitifnore
│── app.py
│── config.py
│── README.md
│── requirements.txt
```
Blueprints to seperate api logical components / group together similar functionality - reusability

## Q

Any user can create event || Only organisers create events