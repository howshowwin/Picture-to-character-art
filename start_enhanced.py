#!/usr/bin/env python3
"""
Enhanced Character Art Converter - Startup Script
"""

import os
import sys
import subprocess
import webbrowser
import time
import signal
import platform
from pathlib import Path

def check_python_version():
    """Check if Python version is 3.8 or higher"""
    if sys.version_info < (3, 8):
        print("Error: Python 3.8 or higher is required")
        sys.exit(1)

def install_requirements():
    """Install required packages"""
    print("Checking dependencies...")
    backend_dir = Path(__file__).parent / "backend"
    requirements_file = backend_dir / "requirements.txt"
    
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", str(requirements_file)], 
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        print("✓ Dependencies installed")
    except subprocess.CalledProcessError:
        print("Warning: Failed to install some dependencies")
        print("Please run: pip install -r backend/requirements.txt")

def start_backend():
    """Start the backend server"""
    print("Starting backend server on port 8002...")
    backend_dir = Path(__file__).parent / "backend"
    main_file = backend_dir / "main.py"
    
    # Start backend process
    if platform.system() == "Windows":
        # Windows: Create new console window
        process = subprocess.Popen([sys.executable, str(main_file)], 
                                 creationflags=subprocess.CREATE_NEW_CONSOLE)
    else:
        # Unix/Linux/Mac: Run in background
        process = subprocess.Popen([sys.executable, str(main_file)])
    
    # Wait for server to start
    time.sleep(3)
    
    # Check if server is running
    try:
        import requests
        response = requests.get("http://localhost:8002/health", timeout=5)
        if response.status_code == 200:
            print("✓ Backend server is running")
    except:
        print("⚠ Backend server may not be running properly")
    
    return process

def open_frontend():
    """Open the enhanced frontend in browser"""
    print("Opening enhanced frontend in browser...")
    frontend_dir = Path(__file__).parent / "frontend"
    enhanced_html = frontend_dir / "enhanced.html"
    
    # Convert to file URL
    file_url = enhanced_html.as_uri()
    
    # Open in default browser
    webbrowser.open(file_url)
    print("✓ Frontend opened in browser")

def signal_handler(signum, frame):
    """Handle Ctrl+C gracefully"""
    print("\n\nShutting down...")
    sys.exit(0)

def main():
    """Main startup function"""
    print("=== Enhanced Character Art Converter ===")
    print()
    
    # Check Python version
    check_python_version()
    
    # Install requirements
    install_requirements()
    
    # Start backend
    backend_process = start_backend()
    
    # Open frontend
    open_frontend()
    
    print()
    print("Enhanced Character Art Converter is now running!")
    print()
    print("Backend API: http://localhost:8002")
    print("Frontend: file:///" + str(Path(__file__).parent / "frontend" / "enhanced.html"))
    print()
    print("Press Ctrl+C to stop the server...")
    
    # Set up signal handler
    signal.signal(signal.SIGINT, signal_handler)
    
    try:
        # Keep the script running
        backend_process.wait()
    except KeyboardInterrupt:
        print("\n\nShutting down...")
        backend_process.terminate()
        sys.exit(0)

if __name__ == "__main__":
    main()