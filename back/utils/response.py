from flask import request, make_response
import math

# Standardized success and error 
def success_response(data=None, message="Success", status_code=200):
    response = {
        "status": "success",
        "message": message,
        "code": status_code
    }
    
    if data is not None:
        response["data"] = data
        
    return response, status_code

def error_response(message="Error", status_code=400, errors=None):
    response = {
        "status": "error",
        "message": message,
        "code": status_code
    }
    
    if errors:
        response["errors"] = errors
        
    return response, status_code

def paginate_response(query, schema=None, page=1, per_page=10):
    page = int(request.args.get('page', page))
    per_page = int(request.args.get('per_page', per_page))
    
    paginated_query = query.paginate(page=page, per_page=per_page, error_out=False)
    
    if schema:
        items = schema.dump(paginated_query.items, many=True)
    else:
        items = [item.to_dict() for item in paginated_query.items]
    
    return {
        "status": "success",
        "code": 200,
        "data": {
            "items": items,
            "pagination": {
                "total": paginated_query.total,
                "page": page,
                "per_page": per_page,
                "has_next": paginated_query.has_next,
                "has_prev": paginated_query.has_prev
            }
        }
    }, 200