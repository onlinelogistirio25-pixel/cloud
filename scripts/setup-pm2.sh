#!/usr/bin/env bash
# Helper to show the exact pm2 startup command for this user and optionally run it
USER_NAME=$(whoami)
HOME_DIR=$HOME
CMD="sudo env PATH=\$PATH:/usr/local/bin pm2 startup launchd -u ${USER_NAME} --hp ${HOME_DIR}"
echo "This will configure pm2 to start on boot for user ${USER_NAME}"
echo "Run the following command (it will ask for your password):"
echo
echo "  ${CMD}"
echo
read -p "Run it now? [y/N] " -r
if [[ $REPLY =~ ^[Yy]$ ]]; then
  eval "${CMD}"
  echo "If successful, run 'npx pm2 save' to persist the process list."
fi
