import asyncio
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

async def test_query():
    mongo_uri = os.getenv("MONGODB_URI")
    if not mongo_uri:
        print("MONGODB_URI not found")
        return

    client = AsyncIOMotorClient(mongo_uri)
    db = client.get_default_database()
    
    # 1. Setup dummy lobby
    lobby_doc = {
        "game_id": "TEST01",
        "status": "waiting",
        "max_players": 5,
        "players": [{"user_id": "1"}, {"user_id": "2"}] # 2 players
    }
    
    # Clear existing
    await db.test_lobbies.delete_many({"game_id": "TEST01"})
    result = await db.test_lobbies.insert_one(lobby_doc)
    lobby_id = result.inserted_id
    print(f"Inserted lobby {lobby_id}")
    
    # 2. Try update
    # Condition: len(players) < max_players (2 < 5) -> Should Update
    update_result = await db.test_lobbies.update_one(
        {
            "_id": lobby_id,
            "status": "waiting",
            "$expr": {"$lt": [{"$size": "$players"}, "$max_players"]}
        },
        {"$push": {"players": {"user_id": "3"}}}
    )
    
    print(f"Matched: {update_result.matched_count}")
    print(f"Modified: {update_result.modified_count}")
    
    if update_result.modified_count == 1:
        print("✅ Query works!")
    else:
        print("❌ Query failed to match/modify")
        
    # 3. Try failure case
    # Set max_players to 3. Current is 3. 3 < 3 is False. Should Fail.
    await db.test_lobbies.update_one({"_id": lobby_id}, {"$set": {"max_players": 3}})
    
    fail_result = await db.test_lobbies.update_one(
        {
            "_id": lobby_id,
            "status": "waiting",
            "$expr": {"$lt": [{"$size": "$players"}, "$max_players"]}
        },
        {"$push": {"players": {"user_id": "4"}}}
    )
    
    print(f"Failure Case - Matched: {fail_result.matched_count}")
    print(f"Failure Case - Modified: {fail_result.modified_count}")
    
    if fail_result.modified_count == 0:
        print("✅ Blocking works!")
    else:
        print("❌ Failed to block overflow")

if __name__ == "__main__":
    asyncio.run(test_query())
