# backend.node.tinkoff.invest
Node js tinkoff bot

# .env file
* Carrier
SANDBOX_TOKEN="t.JHu1ABGttwLLmlOFEf0oaqcVJ7v9R8zQWofuEhLRyCaNzEQ7npqt4kMPNm2QIbtxTR6_hP79y0s2w1fRCovaWg"

* PostgreSql
POSTGRES_DB=db_name
POSTGRES_USER=db_user
POSTGRES_PASSWORD=db_pass
POSTGRES_PORT=5432

* PgAdmin
PGADMIN_PORT=8080
PGADMIN_DEFAULT_EMAIL=some@email
PGADMIN_DEFAULT_PASSWORD=some-password
PGADMIN_LISTEN_PORT=80

# pgAdmin settings
pgadmin/servers.json
```
{
  "Servers": {
    "1": {
      "Name": "serverName",
      "Group": "Servers",
      "Host": "hostName",
      "Port": 5432,
      "MaintenanceDB": "DbName",
      "Username": "DbUser",
      "SSLMode": "prefer",
      "PassFile": "/pgpassfile"
    }
  }
}
```