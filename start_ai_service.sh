#!/bin/bash
cd ai_services
python3 -m uvicorn main:app --host 0.0.0.0 --port 5001
