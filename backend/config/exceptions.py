"""
Consistent API error format for the whole backend.

Every error response looks like:
{
    "error": {
        "message": "Human readable message",
        "details": { ... optional field errors ... }
    }
}
"""
from rest_framework.views import exception_handler as drf_exception_handler


def custom_exception_handler(exc, context):
    response = drf_exception_handler(exc, context)

    if response is None:
        return response

    message = "Something went wrong. Please try again."
    details = None

    data = response.data
    if isinstance(data, dict):
        if "detail" in data and len(data) == 1:
            message = str(data["detail"])
        else:
            details = data
            message = "Please check the submitted data."
    elif isinstance(data, list) and data:
        message = str(data[0])

    status_code = response.status_code
    if status_code == 401:
        message = "Your session has expired. Please log in again."
    elif status_code == 403:
        message = "You are not authorized to perform this action."
    elif status_code == 404:
        message = "The requested resource was not found."

    response.data = {"error": {"message": message, "details": details}}
    return response
