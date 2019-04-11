You are provided data on the stations and lines of Singapore's urban rail system, including planned additions over the next decade. Your task is to use this data to build a React app to help users find routes from any station to any other station on this future network.

The app should have the following minimal functionality:
- Allow the user to specify origin and destination stations.
- Display one or more routes from the origin to the destination, ordered by some efficiency heuristic. Routes should have one or more steps, like "Take <line> from <station> to <station>" or "Change to <line>". You may add other relevant information to the results.

## Data Description

The included file, stations.json, describes Singapore's future rail network. Here is an extract:

```
{
  ...
  "Bukit Gombak": {"NS": 3},
  "Bukit Panjang": {"BP": [6, 14], "DT": 1},
  "Buona Vista": {"EW": 21, "CC": 22, "CE": 22},
  ...
}
```

The keys of the root JSON object are station names (e.g. Bukit Gombak) and the values specify the position of each station on one or more train lines. For example, Bukit Gombak has position 3 on the "NS" (North-South) line.

Interchange stations like Buona Vista have positions on multiple lines: here it is at position 21 on the EW (East-West) line and 22 on the CC and CE lines.

A few lines form loops: For instance, the Bukit Panjang station has positions 6 and 14 on the BP (Bukit Panjang LRT) line because it closes the loop on that line.

Note that position numbers are not always sequential; the gaps represent spaces left for future stations, and may be ignored for this exercise.

Trains run in both directions on every line.

## Submission

Using create-react-app is recommended but not required. If not using it, all dependencies should be specified in package.json, and instructions for building and serving the app should be included.

You may zip and upload your code to Google Drive. Please exclude node_modules from the archive.

## Evaluation

Your submission will be judged on:
- code quality and architecture
- user experience
- quality of the route suggestions
