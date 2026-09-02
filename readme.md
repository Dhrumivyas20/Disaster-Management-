Frontend
# 1. Install dependencies (if you haven't already)
pnpm install

# 2. Start the Vite development server
pnpm --filter @workspace/pixelalchemy-dashboard run dev


Backend
# 1. Navigate to the backend directory
cd backend

# 2. Create & activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate

# 3. Install Python dependencies
pip install -r requirements.txt

# 4. Start the FastAPI server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

