# Contributing to Massdriver Bundles

## A Note on Bundle Philosophy
Bundles are intended to be tightly use-case scoped, intention-based reusable pieces of IaC
for use in the Massdriver platform, see [Building the Right Size Bundle](https://docs.massdriver.cloud/bundles/development#building-the-right-sized-bundle).
For this reason, major feature additions that broaden the scope of an existing bundle are likely to be rejected by the community.


## How to contribute
There are several ways to contribute Massdriver bundles:
- Fix bugs
- Contribute minor non-interface breaking improvements to existing bundles in the massdriver-cloud organization

If you do choose to contribute to a public massdriver bundle the process is as follows:
1. open a tracking issue to describe the change or fix you plan to implement
2. fork the repo
3. cut a new branch for your feature from the tip of `origin/main`
4. push your changes and open a pull request

# ## PR reviews on Existing Bundle Repos
For the time being, only Massdriver employees will have approve / merge / commit access to our bundle repos.

## Alternatives to contributing to public bundles
- Fork an existing bundle if you are trying to make a major feature change or support a different use case with similar technology.
- [Develop](https://docs.massdriver.cloud/bundles/development) your own bundle from scratch and optionally open source in you own organization.

## Not sure whether to to Fix or Fork?
Before doing a lot of hard work, please open an issue on the existing bundle repo describing the change you'd
and tag your issue `proposal` and the community will reivew it and get back to you on if your change fits in
the existing bundle scope. You can tag the Code Owners of that bundle repo to expedite getting feedback.
