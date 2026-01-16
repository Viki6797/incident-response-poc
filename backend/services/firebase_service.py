# services/firebase_service.py
import firebase_admin
from firebase_admin import credentials, firestore, auth
import os
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Firebase only once
def initialize_firebase():
    try:
        # Check if already initialized
        if not firebase_admin._apps:
            # Check for JSON string in environment variable (Render.com)
            firebase_json = os.environ.get('FIREBASE_CREDENTIALS_JSON')
            
            if firebase_json:
                # Production: Parse JSON from environment variable
                print("📡 Initializing Firebase from environment variable...")
                service_account_info = json.loads(firebase_json)
                cred = credentials.Certificate(service_account_info)
            else:
                # Development: Use local file
                cred_path = os.getenv('FIREBASE_PRIVATE_KEY_PATH', 'firebase-key.json')
                print(f"💻 Initializing Firebase from local file: {cred_path}")
                
                # Check if file exists
                if not os.path.exists(cred_path):
                    raise FileNotFoundError(
                        f"Firebase credentials file not found at: {cred_path}\n"
                        f"Please set FIREBASE_CREDENTIALS_JSON environment variable or create {cred_path}"
                    )
                
                cred = credentials.Certificate(cred_path)
            
            # Initialize Firebase
            firebase_admin.initialize_app(cred)
            print("✅ Firebase initialized successfully")
        
        # Get Firestore client
        db = firestore.client()
        return db, auth
        
    except Exception as e:
        print(f"❌ Firebase initialization failed: {e}")
        # Don't crash immediately - let health endpoint handle it
        raise

# Get Firestore database instance
def get_firestore():
    try:
        db, _ = initialize_firebase()
        return db
    except Exception as e:
        print(f"❌ Failed to get Firestore: {e}")
        # Return None so endpoints can handle gracefully
        return None

# Get Auth instance
def get_auth():
    try:
        _, auth_instance = initialize_firebase()
        return auth_instance
    except Exception as e:
        print(f"❌ Failed to get Auth: {e}")
        return None

# Test connection
def test_connection():
    try:
        db = get_firestore()
        if db is None:
            return False
            
        # Try a simple operation that doesn't require permissions
        collections = db.collections()
        list(collections)  # Just to test connection
        print("✅ Firebase connection test passed")
        return True
    except Exception as e:
        print(f"❌ Firebase connection test failed: {e}")
        return False