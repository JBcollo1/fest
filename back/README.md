# Flask API backend

Fetch data from db

API serves frontend


# Main Components
1. User Management
- User registration and login
- Role-based access control (Admin, organizer, regular user)
- User profile management
2. Event System
- Create and manage events
- Featured events
- Event categorization
- Search and filtering capabilities
- Date-based event organization
3. Ticket System
- Ticket purchasing
- Ticket validation
- User ticket management
4. Payment System
- Payment processing
- Payment history
- Admin payment monitoring

## To do
- Ticket types
  - group, VIP, ...


## setup
Install requirements

```
pip install -r requirements.txt
```

run flask api in dev mode on `http://127.0.0.1:5000`

```
flask run
```

### API endpoints


| Endpoint | Method | Description | Authentication Required |
|----------|---------|-------------|------------------------|
| Users |
| /api/users | GET | Get all users | Yes (Admin only) |
| /api/users | POST | Register new user | No |
| /api/users/<user_id> | GET | Get specific user | Yes (Self or Admin) |
| /api/users/<user_id> | PUT | Update user | Yes (Self or Admin) |
| /api/users/<user_id> | DELETE | Delete user | Yes (Self or Admin) |
| /api/users/<user_id>/roles | GET | Get user roles | Yes (Admin only) |
| /api/users/<user_id>/roles | POST | Add role to user | Yes (Admin only) |
| /api/login | POST | User login | No |
| Events |
| /api/events | GET | Get all events (with filters) | No |
| /api/events | POST | Create new event | Yes (Organizer only) |
| /api/events/<event_id> | GET | Get specific event | No |
| /api/events/<event_id> | PUT | Update event | Yes (Organizer or Admin) |
| /api/events/<event_id> | DELETE | Delete event | Yes (Organizer or Admin) |
| /api/events/<event_id>/categories | GET | Get event categories | No |
| /api/events/featured | GET | Get featured events | No |
| Tickets |
| /api/tickets | GET | Get all tickets | Yes (Admin only) |
| /api/tickets | POST | Purchase ticket | Yes |
| /api/tickets/<ticket_id> | GET | Get specific ticket | Yes |
| /api/users/<user_id>/tickets | GET | Get user's tickets | Yes |
| Payments |
| /api/payments | GET | Get all payments | Yes (Admin only) |
| /api/payments/<payment_id> | GET | Get specific payment | Yes |
| Categories |
| /api/categories | GET | Get all categories | No |
| /api/categories | POST | Create category | Yes (Admin only) |
| /api/categories/<category_id> | GET | Get specific category | No |
| /api/categories/<category_id> | PUT | Update category | Yes (Admin only) |
| /api/categories/<category_id> | DELETE | Delete category | Yes (Admin only) |
| Discount Codes |
| /api/discount-codes | GET | Get all discount codes | Yes (Admin only) |
| /api/discount-codes | POST | Create discount code | Yes (Admin only) |
| /api/discount-codes/<discount_code_id> | GET | Get specific discount code | Yes (Admin only) |
| /api/discount-codes/validate/&lt;code&gt; | GET | Validate discount code | No |


### Query parameters for Events
When using the GET `/api/events` endpoint, you can use these query parameters:
category: Filter by category name
search: Search in title and description
start_date: Filter events after this date
end_date: Filter events before this date
organizer_id: Filter by organizer

### Response Format
All API responses follow a standard format:
```json
{
    "status": "success",
    "message": "Operation message",
    "code": 200,
    "data": {
        // Response data
    }
}
```
### Db schema

[database schema](db_schema_march25.pdf)
