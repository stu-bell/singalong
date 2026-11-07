# Change process

Specs must represent the intention for the implementation. 

Changes may be specified in ./changes/ as feature (feat/) or bug fixes (fix/) or be requested directly as a user prompt.

When executing a user request, or implementing a change, you must check for relevant specs. If the user request describes functionality not covered by the spec or that is different from the current spec, draft a revision of the spec and ask the user if they approve of the spec revision, before making the change. This is important to keep the specs in-sync with the state of the implementation, and to keep the user aware of the evolution of the spec. 

Before implementing a change, make a plan and save in ./plans/ for review. Include an impact assessment in the plan, and highlight any alternatives that might be worth considering. A plan should include draft updates to the spec, to keep any implementation in sync with the spec. A plan has draft status, until it is approved by the user.

Once a plan has been implemented, the plan, and change file (feat or fix) get moved to the done folder, once the implementation has been reviewed and approved.

