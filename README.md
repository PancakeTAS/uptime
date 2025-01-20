# uptime
uptime is a super small application, that logs the status of various services on your system into a database and provides a visual representation of the uptime of those services.

## Installation
Installing uptime is relatively straightforward. Copy the `frontend` folder to your webserver and compile the uptime program using `cargo build --release`. The compiled binary can be found in `target/release/uptime`.

## Configuration
uptime is designed to work with almost all types of deployments. Checking whether a service is up or not is done via a bash command. The bash command should return a status code of 0 if the service is up, otherwise the service is considered down.

Configuring uptime itself is done via a single YAML file:
```yml
port: 8005 # make sure to reverse proxy or open this port to the internet
server:
    - name: "My Server"
      category:
          - name: "Core Services"
            service:
                - name: "Example Service"
                  info: "Example service that is always up"
                  command: "true"
                - name: "System Service"
                  info: "Service that checks whether the postgresql systemd service is running"
                  command: "systemctl is-active --quiet postgresql"
          - name: "Network Services"
            service:
                - name: "Cloudflare DNS"
                  info: "Service that checks whether the cloudflare dns server is reachable"
                  command: "ping -W 1 -c -q 1
```

Adjust the `script.js` file in the `frontend` folder to point to your server.
