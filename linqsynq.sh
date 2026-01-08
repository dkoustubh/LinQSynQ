#!/bin/bash

# LinQSynQ Quick Commands
# Easy access to common operations

COLOR_GREEN="\033[0;32m"
COLOR_YELLOW="\033[1;33m"
COLOR_BLUE="\033[0;34m"
COLOR_RED="\033[0;31m"
COLOR_RESET="\033[0m"

echo -e "${COLOR_BLUE}╔════════════════════════════════════════════╗${COLOR_RESET}"
echo -e "${COLOR_BLUE}║          LinQSynQ Quick Commands          ║${COLOR_RESET}"
echo -e "${COLOR_BLUE}╚════════════════════════════════════════════╝${COLOR_RESET}"
echo ""

# Check if a command is provided
if [ $# -eq 0 ]; then
    echo "Available commands:"
    echo ""
    echo -e "  ${COLOR_GREEN}./linqsynq.sh test${COLOR_RESET}       - Test PLC connection (all rack/slot combos)"
    echo -e "  ${COLOR_GREEN}./linqsynq.sh start${COLOR_RESET}      - Start LinQSynQ (backend + frontend + Node-RED)"
    echo -e "  ${COLOR_GREEN}./linqsynq.sh start-opcua${COLOR_RESET} - Start LinQSynQ (OPC UA version)"
    echo -e "  ${COLOR_GREEN}./linqsynq.sh ping${COLOR_RESET}       - Ping the PLC to check network"
    echo -e "  ${COLOR_GREEN}./linqsynq.sh ports${COLOR_RESET}      - Check if PLC ports are accessible"
    echo -e "  ${COLOR_GREEN}./linqsynq.sh status${COLOR_RESET}     - Show API status"
    echo -e "  ${COLOR_GREEN}./linqsynq.sh logs${COLOR_RESET}       - View CSV logs"
    echo -e "  ${COLOR_GREEN}./linqsynq.sh help${COLOR_RESET}       - Show this help message"
    echo ""
    exit 0
fi

COMMAND=$1
PLC_IP="192.168.103.24"

case $COMMAND in
    test)
        echo -e "${COLOR_YELLOW}🔍 Testing PLC connection...${COLOR_RESET}"
        node test-connection.js
        ;;
    
    start)
        echo -e "${COLOR_GREEN}🚀 Starting LinQSynQ...${COLOR_RESET}"
        echo -e "${COLOR_BLUE}   Dashboard: http://localhost:5173${COLOR_RESET}"
        echo -e "${COLOR_BLUE}   API: http://localhost:3001${COLOR_RESET}"
        echo -e "${COLOR_BLUE}   Node-RED: http://localhost:1881/red${COLOR_RESET}"
        echo ""
        npm run dev
        ;;

    start-opcua)
        echo -e "${COLOR_GREEN}🚀 Starting LinQSynQ (OPC UA)...${COLOR_RESET}"
        echo -e "${COLOR_BLUE}   Dashboard: http://localhost:5173${COLOR_RESET}"
        echo -e "${COLOR_BLUE}   API: http://localhost:3001${COLOR_RESET}"
        echo -e "${COLOR_BLUE}   Node-RED: http://localhost:1881/red${COLOR_RESET}"
        echo ""
        npm run dev:opcua
        ;;
    
    ping)
        echo -e "${COLOR_YELLOW}📡 Pinging PLC at ${PLC_IP}...${COLOR_RESET}"
        ping -c 3 $PLC_IP
        ;;
    
    ports)
        echo -e "${COLOR_YELLOW}🔌 Checking PLC ports...${COLOR_RESET}"
        echo ""
        echo -n "  Port 102 (S7): "
        if nc -zv $PLC_IP 102 2>&1 | grep -q succeeded; then
            echo -e "${COLOR_GREEN}✅ Accessible${COLOR_RESET}"
        else
            echo -e "${COLOR_RED}❌ Not accessible${COLOR_RESET}"
        fi
        
        echo -n "  Port 4840 (OPC UA): "
        if nc -zv $PLC_IP 4840 2>&1 | grep -q succeeded; then
            echo -e "${COLOR_GREEN}✅ Accessible${COLOR_RESET}"
        else
            echo -e "${COLOR_RED}❌ Not accessible${COLOR_RESET}"
        fi
        ;;
    
    status)
        echo -e "${COLOR_YELLOW}📊 Fetching API status...${COLOR_RESET}"
        echo ""
        curl -s http://localhost:3001/api/status | json_pp
        if [ $? -ne 0 ]; then
            echo -e "${COLOR_RED}❌ LinQSynQ is not running. Start it with: ./linqsynq.sh start${COLOR_RESET}"
        fi
        ;;
    
    logs)
        echo -e "${COLOR_YELLOW}📄 CSV Logs (latest 20 lines):${COLOR_RESET}"
        echo ""
        if [ -d "logs" ]; then
            LATEST_LOG=$(ls -t logs/*.csv 2>/dev/null | head -1)
            if [ -n "$LATEST_LOG" ]; then
                tail -n 20 "$LATEST_LOG"
            else
                echo -e "${COLOR_RED}No log files found${COLOR_RESET}"
            fi
        else
            echo -e "${COLOR_RED}Logs directory not found${COLOR_RESET}"
        fi
        ;;
    
    help|--help|-h)
        $0
        ;;
    
    *)
        echo -e "${COLOR_RED}Unknown command: $COMMAND${COLOR_RESET}"
        echo ""
        $0
        exit 1
        ;;
esac
