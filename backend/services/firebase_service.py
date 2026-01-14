import os
import json
import firebase_admin
from firebase_admin import credentials, firestore, auth

# Initialize Firebase only once
def initialize_firebase():
    try:
        if not firebase_admin._apps:
            firebase_key_json = os.getenv("FIREBASE_KEY_JSON")

            if not firebase_key_json:
                raise Exception("FIREBASE_KEY_JSON environment variable not set")

            cred_dict = json.loads(firebase_key_json)
            cred = credentials.Certificate(cred_dict)

            firebase_admin.initialize_app(cred)
            print("✅ Firebase initialized successfully")

        db = firestore.client()
        return db, auth

    except Exception as e:
        print(f"❌ Firebase initialization failed: {e}")
        raise


def get_firestore():
    db, _ = initialize_firebase()
    return db


def get_auth():
    _, auth_instance = initialize_firebase()
    return auth_instance


def test_connection():
    try:
        db = get_firestore()
        test_ref = db.collection("test").document("connection")
        test_ref.set({"test": True})
        test_ref.delete()
        return True
    except Exception as e:
        print(f"❌ Firebase connection test failed: {e}")
        return False
