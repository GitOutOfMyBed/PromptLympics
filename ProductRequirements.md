Background:
We are building a competition/crowdsource/freelance platform like Kaggle focused solely on helping prompts get developed. Although there are existing automated prompting libraries like dspy, a significant portion of manual labor is still performed to craft prompts. We would like to build this competition style platform to help people purchase prompts through a competition.

Features:
Home Page: If signed in redirect here.

Landing Page: If not signed in redirect here. We should have a brief outline and explanation of what this platform is and how it works.

Competition Listing Page: Show all available existing prompt competitions. In this table/listing we should have columns showing a one sentence summary/title of this prompt competition and what needs to be achieved (Clicking here should lead us to the competition page), the prize amount, the organization which created this competition, end date, start date, and current best submission score. Clicking

Competition Page: One page for each competition. It displays the title, the organizer, the prize, begin end dates, and a detailed description. It optionally has an example prompt. It should have additional requirements of the prompt (e.g. character/token limit). It should have sample test cases displayed and the possibility to download the entire training test case.

Competition Submission Page: The competition page will ask the user to submit a competition. It will be a multistep workflow (auto save each step). First the user will fill out the necessary competition description, the background, etc. It will then choose which model they are using, and then upload their training samples that can be used for training. Then they will upload their validation samples that will be used for caluclating the score. (We need to figure out an anti cheat scam so that the validation statistics do match the training statistics otherwise people will never reach a certain score and the submitter can cancel the competition without paying). Then will then decide how to award prizes. Prize for first place, second place, etc... Whether the competition ends immediately at the first submission that reaches a certain accuracy/score. Whether no award is given if a certain threshold is not reached, etc.

User Profile Page: It should have a history of all the users ongoing and previous participated competitions and their results. There should also be an option to submit a competition.

UI/UX/Theme:
Default dark theme with option to choose to use white theme in user settings.
The competitions section should be more of a simple compressed table list rather than using cards.

Tech:
Build for vercel. We should aim for serverless backend, serverless sql storage, and serverless authentication.

RoadMap:
Allow custom ai models. Allow clients to upload a custom model which we then run for them to evaluate prompts.

Incorporate automated prompting. Clients can easily get their optimized prompt by uploading a json file with training examples instead of needing to write a bunch of code using dspy or something else.
