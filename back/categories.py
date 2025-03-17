from flask import request
from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from models import Category, User
from utils.response import success_response, error_response
from utils.auth import admin_required

class CategoryListResource(Resource):
    """
    Resource for category list operations
    """
    def get(self):
        """Get all categories (public)"""
        categories = Category.query.all()
        return success_response(data=[category.to_dict() for category in categories])
    
    @jwt_required()
    @admin_required
    def post(self):
        """Create a new category (admin only)"""
        data = request.get_json()
        
        if 'name' not in data:
            return error_response("Missing required field: name")
            
        # Check if category already exists
        if Category.query.filter_by(name=data['name']).first():
            return error_response("Category already exists")
            
        new_category = Category(name=data['name'])
        
        try:
            db.session.add(new_category)
            db.session.commit()
            return success_response(
                data=new_category.to_dict(),
                message="Category created successfully",
                status_code=201
            )
        except Exception as e:
            db.session.rollback()
            return error_response(f"Error creating category: {str(e)}")

class CategoryResource(Resource):
    """
    Resource for individual category operations
    """
    def get(self, category_id):
        """Get a specific category"""
        category = Category.query.get(category_id)
        
        if not category:
            return error_response("Category not found", 404)
            
        return success_response(data=category.to_dict())
    
    @jwt_required()
    @admin_required
    def put(self, category_id):
        """Update a specific category (admin only)"""
        category = Category.query.get(category_id)
        
        if not category:
            return error_response("Category not found", 404)
            
        data = request.get_json()
        
        if 'name' not in data:
            return error_response("Missing required field: name")
            
        # Check if category name already exists
        existing_category = Category.query.filter_by(name=data['name']).first()
        if existing_category and existing_category.id != category_id:
            return error_response("Category name already exists")
            
        category.name = data['name']
        
        try:
            db.session.commit()
            return success_response(
                data=category.to_dict(),
                message="Category updated successfully"
            )
        except Exception as e:
            db.session.rollback()
            return error_response(f"Error updating category: {str(e)}")
    
    @jwt_required()
    @admin_required
    def delete(self, category_id):
        """Delete a specific category (admin only)"""
        category = Category.query.get(category_id)
        
        if not category:
            return error_response("Category not found", 404)
            
        try:
            db.session.delete(category)
            db.session.commit()
            return success_response(message="Category deleted successfully")
        except Exception as e:
            db.session.rollback()
            return error_response(f"Error deleting category: {str(e)}")