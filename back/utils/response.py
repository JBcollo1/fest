from flask import jsonify, request
import math

# standardised success and error messages
def success_response(data=None, message="Success", status_code=200):
    response = {
        "status": "success",
        "message": message
    }
    
    if data is not None:
        response["data"] = data
        print("response", response)
    else:
        print("no response data")

    return response, status_code

def error_response(message="Error", status_code=400, errors=None):
    response = {
        "status": "error",
        "message": message
    }
    
    if errors is not None:
        response["errors"] = errors
        
    return response, status_code


def paginate_response(query, page=1, per_page=10):
    page = int(request.args.get('page', page))
    per_page = int(request.args.get('per_page', per_page))
    
    paginated_query = query.paginate(page=page, per_page=per_page, error_out=False)
    total = paginated_query.total
    # math.ceil - round up
    total_pages = math.ceil(total / per_page)
    
    # Convert items to dictionaries first to ensure JSON serializable
    items = []
    for item in paginated_query.items:
        if hasattr(item, 'to_dict'):
            items.append(item.to_dict())
        else:
            # If to_dict() is not available, you might need to handle serialization differently
            raise ValueError(f"Object of type {type(item)} must implement to_dict() method")
    
    result = {
        "items": items,
        "pagination": {
            "total_items": total,
            "total_pages": total_pages,
            "current_page": page,
            "per_page": per_page,
            "has_next": paginated_query.has_next,
            "has_prev": paginated_query.has_prev
        }
    }
    
    return result

