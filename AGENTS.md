You must read README.md

# When making changes

## Spec Driven Development

This project is adopting specification driven development. Specs live in spec/*

When executing a user request, you must check for relevant specs. If the user request describes functionality not covered by the spec or that is different from the current spec, draft a revision of the spec and ask the user if they approve of the spec revision, before making the change. This is important to keep the specs in-sync with the state of the implementation, and to keep the user aware of the evolution of the spec. 

## Consistent style

Aim to follow the existing patterns and styles in the codebase where possible. Follow idiomatic conventions of the technologies used wherever possible. Where these conflict, flag this to the user and in code comments but prioritise following the existing patterns unless doing so would increase the risk of bugs, security or performance issues.

## Comments
Add human-readable comments to your functions, modules and constants, configuration, known limits etc.

