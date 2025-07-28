from pydantic import BaseModel

class ShortcutRequest(BaseModel):
    """
    Model representing the request payload to create a desktop shortcut.

    Fields:
    - app_name: The name of the application (used as the shortcut name).
    """
    app_name: str
