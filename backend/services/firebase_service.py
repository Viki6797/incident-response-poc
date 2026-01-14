import firebase_admin
from firebase_admin import credentials, firestore, auth
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Firebase only once
def initialize_firebase():
    try:
        # Check if already initialized
        if not firebase_admin._apps:
            cred_path = os.getenv('FIREBASE_PRIVATE_KEY_PATH', 'firebase-key.json')
            
            # Load credentials
            cred = credentials.Certificate(cred_path)
            
            # Initialize Firebase
            firebase_admin.initialize_app(cred)
            print("✅ Firebase initialized successfully")
            
        # Get Firestore client
        db = firestore.client()
        return db, auth
        
    except Exception as e:
        print(f"❌ Firebase initialization failed: {e}")
        raise

# Get Firestore database instance
def get_firestore():
    db, _ = initialize_firebase()
    return db

# Get Auth instance
def get_auth():
    _, auth_instance = initialize_firebase()
    return auth_instance

# Test connection
def test_connection():
    try:
        db = get_firestore()
        # Try to read a non-existent document (just to test connection)
        test_ref = db.collection('test').document('connection')
        test_ref.set({'test': True, 'timestamp': firestore.SERVER_TIMESTAMP})
        test_ref.delete()
        print("✅ Firebase connection test passed")
        return True
    except Exception as e:
        print(f"❌ Firebase connection test failed: {e}")
        return False