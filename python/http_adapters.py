"""Docs: README.md; official Postal/WildDuck/JMAP boundaries, tested against capture HTTP."""
import json
from urllib.request import Request, urlopen


def request_json(url, headers, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = Request(url, data=data, headers={"Content-Type": "application/json", **headers})
    with urlopen(req, timeout=10) as response:
        return json.load(response)


def postal_send(base_url, key):
    result = request_json(base_url + "/api/v1/send/message", {"X-Server-API-Key": key}, {
        "from": "sender@example.test", "to": ["support@example.test"],
        "subject": "Ticket 42", "plain_body": "Please check ticket 42.",
    })
    if result.get("status") != "success":
        raise RuntimeError(f"Postal rejected request: {result!r}")
    return result["data"]


def wildduck_list(base_url, token, user, mailbox):
    return request_json(f"{base_url}/users/{user}/mailboxes/{mailbox}/messages",
                        {"X-Access-Token": token})


def jmap_query(session_url, token):
    headers = {"Authorization": "Bearer " + token}
    session = request_json(session_url, headers)
    account = session["primaryAccounts"]["urn:ietf:params:jmap:mail"]
    result = request_json(session["apiUrl"], headers, {
        "using": ["urn:ietf:params:jmap:core", "urn:ietf:params:jmap:mail"],
        "methodCalls": [["Email/query", {"accountId": account, "limit": 10}, "q"]],
    })
    responses = result["methodResponses"]
    if any(item[0] == "error" for item in responses):
        raise RuntimeError(f"JMAP method failure: {responses!r}")
    return responses
