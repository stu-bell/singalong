You must read README.md

# Spec Driven Development

This project is adopting specification driven development. Specs live in spec/*

When executing a user request, you must check for relevant specs. If the user request describes functionality not covered by the spec or that is different from the current spec, draft a revision of the spec and ask the user if they approve of the spec revision, before making the change. This is important to keep the specs in-sync with the state of the implementation, and to keep the user aware of the evolution of the spec. 

