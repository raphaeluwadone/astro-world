// The four yearly headline awards are supplied copy: keep them word for word.
// Winner names and stats are shown separately.

export interface AwardVariation {
  title: string
  paragraphs: string[]
}

export interface AwardCopy {
  recognition: string
  personality: string
  variations: AwardVariation[]
}

export const AWARD_COPY: Record<string, AwardCopy> = {
  'mesuts-apprentice': {
    recognition: 'Most assists of the year',
    personality: 'Effortless creativity, vision, intelligence, playmaking and the joy of creating opportunities for teammates.',
    variations: [
      {
        title: 'The Visionary',
        paragraphs: [
          "Some players see the game. Others see things the rest of us haven't even considered yet.",
          'The perfectly weighted pass, the impossible angle, the little opening that somehow becomes a goalscoring opportunity.',
          "This year, you've made creating chances look like second nature.",
          'The numbers speak for themselves. The vision speaks even louder.',
          "Congratulations, Özil's Apprentice. The art of the assist is alive and well.",
        ],
      },
      {
        title: 'The Provider',
        paragraphs: [
          'Goals get the headlines, but someone has to make them happen.',
          'Behind every great finish is often a pass that deserves just as much appreciation.',
          "For the player who has consistently supplied the ammunition, picked out teammates and turned opportunities into goals, this one's for you.",
          "You've been generous with the assists this year. We hope your teammates have been equally generous with the celebrations.",
          "Özil's Apprentice.",
        ],
      },
      {
        title: 'The Footballing Architect',
        paragraphs: [
          'Every beautiful goal has a story. Sometimes, that story begins with you.',
          'A perfectly timed delivery, a clever pass between the lines or an unexpected ball that opens up the entire game.',
          "You've spent the year designing opportunities and giving teammates the finishing touches to remember.",
          'The blueprint was yours. The goals were theirs.',
          "Congratulations, Özil's Apprentice.",
        ],
      },
      {
        title: 'The Unseen Genius',
        paragraphs: [
          'Not every contribution needs a celebration of its own.',
          'Sometimes, the best work happens before the ball even reaches the goalscorer.',
          "The awareness, the timing, the decision-making and the quality of execution. It's all part of a craft that deserves recognition.",
          "This year, you've made creating goals your speciality.",
          "For the player who knows that the final pass can be just as beautiful as the final finish: Özil's Apprentice.",
        ],
      },
      {
        title: 'The Assist Merchant',
        paragraphs: [
          'Another game, another defence unlocked. Another teammate with a reason to celebrate.',
          'At this point, providing assists has practically become a personal tradition.',
          "Whether it's a defence-splitting through ball, a perfectly delivered cross or a clever little pass, you've found a way to make things happen.",
          'Your teammates owe you a few thank-you notes.',
          "Congratulations, Özil's Apprentice. Keep the deliveries coming!",
        ],
      },
    ],
  },
  'cr7-syndrome': {
    recognition: 'Most goals of the year',
    personality: 'Confidence, ambition, determination, finishing ability, consistency and an unmistakable goal-scoring mentality.',
    variations: [
      {
        title: 'The Goal Machine',
        paragraphs: [
          'Some people look for opportunities. Others make a habit of finding the back of the net.',
          "This year, you've done exactly that.",
          "The finishes, the positioning, the instinct and the ability to turn chances into goals. You've given the opposition plenty to think about and the scoreboard plenty to record.",
          "The numbers are in, and there's no debate.",
          'Congratulations, CR7 Syndrome. SIIIIUUUU!',
        ],
      },
      {
        title: 'The Relentless One',
        paragraphs: [
          'One goal is good. Two is better. But apparently, stopping there was never part of the plan.',
          'A season of consistency, determination and a rather impressive relationship with the back of the net.',
          "You've shown that goals don't happen by accident. They come from preparation, confidence and knowing exactly what to do when the opportunity arrives.",
          'Congratulations to our top scorer.',
          'CR7 Syndrome. The pursuit never stops.',
        ],
      },
      {
        title: 'The Finisher',
        paragraphs: [
          'Give this player half a chance and suddenly the goalkeeper has a very busy afternoon.',
          "Whether it's a composed finish, a powerful strike or a perfectly timed run, you've demonstrated what it means to be a natural goalscorer.",
          'The instinct is there. The confidence is there. And judging by the numbers, the goals certainly are.',
          "Congratulations, CR7 Syndrome. You've earned your moment.",
        ],
      },
      {
        title: 'The Main Attraction',
        paragraphs: [
          'The ball finds its way into the box. The opportunity presents itself. And somewhere in the distance, a celebration is already being rehearsed.',
          "You've made scoring goals one of the defining features of your season.",
          'A little flair, plenty of confidence and an undeniable eye for goal.',
          'The spotlight is yours. The celebrations are yours too.',
          'CR7 Syndrome. SIIIIUUUU!',
        ],
      },
      {
        title: 'The Record Chaser',
        paragraphs: [
          'Records are there to be challenged, numbers are there to be improved, and goals are there to be scored.',
          "This year, you've approached all three with admirable enthusiasm.",
          "Every match has been another opportunity to add to the tally, and you've certainly made those opportunities count.",
          'The golden boot has found its rightful owner.',
          "Congratulations, CR7 Syndrome. What's the target for next year?",
        ],
      },
    ],
  },
  'ramos-energy': {
    recognition: 'Overall defender of the year',
    personality: 'Authority, resilience, leadership, commitment, defensive intelligence, competitiveness and determination.',
    variations: [
      {
        title: 'The Enforcer',
        paragraphs: [
          'Every team needs someone who takes defending personally.',
          'Someone willing to put their body on the line, read the danger, win the challenge and stand firm when the pressure rises.',
          "This year, you've embodied that responsibility.",
          'Strong in the tackle, composed under pressure and always ready to put the team first.',
          'Congratulations, The Ramos Protocol. The backline salutes you.',
        ],
      },
      {
        title: 'The Last Line',
        paragraphs: [
          'When the opposition comes knocking, someone has to answer.',
          'The timely interception, the crucial clearance, the perfectly judged tackle and the determination to see the job through.',
          "You've been that dependable presence throughout the year.",
          "Defending isn't always glamorous, but you've made it something worth celebrating.",
          'Congratulations, The Ramos Protocol.',
        ],
      },
      {
        title: "Captain's Mentality",
        paragraphs: [
          "Leadership isn't always about wearing the armband.",
          "Sometimes it's about setting the standard, organising the team, taking responsibility and showing up when the game demands it.",
          "You've brought all of that to the defensive side of the game this year.",
          'A reliable presence, a strong competitor and a player others can count on.',
          "The Ramos Protocol. A defender's defender.",
        ],
      },
      {
        title: 'The Defensive Authority',
        paragraphs: [
          'There is an art to knowing when to tackle, when to intercept, when to hold your position and when to put everything on the line.',
          "You've demonstrated that understanding throughout the year.",
          'Composure, commitment and a willingness to compete for every ball.',
          'The opposition may have arrived with a plan, but you certainly made them work for it.',
          'Congratulations, The Ramos Protocol.',
        ],
      },
      {
        title: 'No Easy Passage',
        paragraphs: [
          "Defending is about more than stopping goals. It's about anticipation, discipline, communication and making the right decisions when it matters most.",
          "You've brought those qualities together in a season worth recognising.",
          'From the first challenge to the final clearance, your contribution has been invaluable.',
          'The defensive standard has been set.',
          'The Ramos Protocol. No easy passage.',
        ],
      },
    ],
  },
  'messi-ah': {
    recognition: 'Overall player of the year',
    personality:
      'Effortless genius, understated confidence, creativity, consistency, versatility and the ability to influence every aspect of the game.',
    variations: [
      {
        title: 'The Chosen One',
        paragraphs: [
          'Some seasons produce outstanding players. Others produce performances that are difficult to put into words.',
          "This year, you've been a little bit of everything: the creator, the finisher, the difference-maker and the player who always seems to have another moment of magic in reserve.",
          'An outstanding all-round contribution, from beginning to end.',
          'Congratulations, La Pulga Supreme. The crown is yours.',
        ],
      },
      {
        title: 'The Complete Package',
        paragraphs: [
          'Goals, assists, creativity, consistency and the ability to influence a game in more ways than one.',
          "You've brought everything together this year.",
          "It's one thing to excel in a particular role. It's another to make your presence felt wherever the game takes you.",
          'A season of quality, commitment and undeniable impact.',
          'Ladies and gentlemen, your La Pulga Supreme.',
        ],
      },
      {
        title: 'Effortlessly Different',
        paragraphs: [
          'Some players need a moment to make their mark. Others seem to make every moment count.',
          'A clever touch here, an unexpected pass there, a finish that leaves everyone appreciating the quality of the execution.',
          "You've brought a special kind of football to the pitch this year.",
          'No unnecessary noise. Just quality, consistency and moments worth remembering.',
          'La Pulga Supreme. Pure footballing class.',
        ],
      },
      {
        title: 'The Defining Performer',
        paragraphs: [
          'Every great football season has its defining performer.',
          'The player who shows up, influences the big moments and gives everyone something to talk about.',
          'This year, that story has had your name written all over it.',
          "From the performances to the contributions, you've given us plenty of reasons to recognise your excellence.",
          'The spotlight is yours.',
          'La Pulga Supreme. The defining player of the year.',
        ],
      },
      {
        title: 'Simply Different',
        paragraphs: [
          'You can analyse the statistics, debate the performances and discuss the finer details of the game.',
          "But sometimes, the simplest explanation is the best one: you've been exceptional.",
          'The quality, the consistency, the intelligence and the impact have all come together to make this a season to remember.',
          'A worthy recognition for a remarkable year.',
          'Congratulations, La Pulga Supreme. Enjoy your moment.',
        ],
      },
    ],
  },
}

Object.assign(AWARD_COPY, {
  'week-motm': {
    recognition: 'Voted best player on the day',
    personality: 'Influence, energy, consistency and the knack of being at the centre of everything good.',
    variations: [
      {
        title: 'The Difference-Maker',
        paragraphs: [
          'Every matchday has a story, and every story needs someone at the centre of it. This week, that someone was you.',
          "The runs that pulled defenders out of shape, the touches that kept the ball moving, the moments that turned a close game in your team's favour. None of it went unnoticed.",
          "Man of the Match isn't handed out for one lucky moment. Your teammates watched you for the whole game, and when the votes came in, they said the same thing.",
          "That's the best kind of recognition there is: the people you played with, and against, agreeing that you made the difference.",
          "Congratulations, Man of the Match. Enjoy the week. It's yours.",
        ],
      },
      {
        title: "The Name on Everyone's Lips",
        paragraphs: [
          'When the final whistle went and the votes started coming in, one name kept appearing.',
          'Yours.',
          'Maybe it was the goals. Maybe it was the graft, the tackles nobody else fancied, or the quiet way you seemed to control the tempo whenever the ball came near you. Most likely, it was all of it.',
          'Whatever it was, you gave everyone something to remember from the day, and something to talk about on the way home.',
          'Wear it well until next Sunday. Congratulations, Man of the Match.',
        ],
      },
      {
        title: 'The Standout',
        paragraphs: [
          'Some games are decided by a single moment. This one was shaped by a single player.',
          'You were everywhere: closing down, linking up, popping up in the right place at exactly the right time.',
          "It's one thing to play well. It's another to play so well that your teammates go out of their way to say so.",
          'For one week, the matchday belongs to you. The highlights, the bragging rights and the badge to go with them.',
          'Congratulations, Man of the Match. Same again next Sunday?',
        ],
      },
    ],
  },
  'week-clean-sheet': {
    recognition: 'Kept a clean sheet',
    personality: 'Concentration, organisation, bravery and refusing to let anything through.',
    variations: [
      {
        title: 'Nothing Doing',
        paragraphs: [
          'A full game of attacks, shots, crosses and scrambles in the box. And at the end of it all, the most satisfying number in football: zero.',
          "Clean sheets don't happen by accident. They take concentration for every minute, communication when it gets busy, and a willingness to throw yourself in the way when it counts.",
          'There will have been moments when it nearly went in. There always are. The difference is that this time, nothing got through.',
          'Attackers get the headlines. Clean sheets win the arguments afterwards.',
          'Congratulations, Clean Sheet. The door stayed shut.',
        ],
      },
      {
        title: 'The Locked Door',
        paragraphs: [
          'The opposition came with ideas. They had runners, they had shooters and they had a plan.',
          'They left with nothing.',
          'Every block, every save, every well-timed challenge and every shout to a teammate to pick up their man added up to a game where the net never moved.',
          "That's a collective effort, and you were at the heart of it.",
          'Congratulations on the Clean Sheet. Keep the door locked next week too.',
        ],
      },
      {
        title: 'Zero Means Zero',
        paragraphs: [
          "There's a special kind of satisfaction that comes from a clean sheet. Nobody remembers every save, but everybody remembers the score.",
          'This week, the score on your side said nothing at all.',
          'It took patience when the pressure came, composure when the ball was loose in the box, and a stubborn refusal to give the opposition anything easy.',
          'Defending well is an art. Keeping it up for a whole game is a discipline.',
          "Congratulations, Clean Sheet. Nothing to see here, and that's exactly the point.",
        ],
      },
    ],
  },
  'bag-of-three': {
    recognition: 'Scored a hat-trick in one match',
    personality: 'Ruthlessness, hunger, timing and the refusal to stop at two.',
    variations: [
      {
        title: 'The Hat-Trick Hero',
        paragraphs: [
          'One goal is a contribution. Two goals is a very good day. Three goals is a story people will be telling for weeks.',
          "You found the net, you found it again, and then, when most players would have been happy to take the applause, you decided you weren't finished.",
          'Hat-tricks take more than finishing. They take hunger, timing and the confidence to keep asking for the ball when the game is already going your way.',
          'Somewhere, a match ball has your name on it. Keep it somewhere safe.',
          'Congratulations, Bag of Three.',
        ],
      },
      {
        title: 'Three and Counting',
        paragraphs: [
          "There's a particular feeling when the third one goes in. The celebrations get louder, the defenders get quieter and, for a moment, the whole match belongs to you.",
          "This year, you've had that feeling.",
          "It doesn't happen often. Plenty of very good players go whole seasons without managing it. You did it in a single game.",
          'The goals were yours, the moment was yours and now the badge is too.',
          'Congratulations, Bag of Three. The match ball is all yours.',
        ],
      },
      {
        title: 'Never Satisfied',
        paragraphs: [
          'The first goal settles the nerves. The second makes the game safe. The third is pure appetite.',
          "That's what a hat-trick really says about a player: that they wanted more, and kept wanting more, until the scoreboard agreed.",
          'Your teammates kept feeding you, you kept finishing, and the opposition ran out of ideas long before you ran out of goals.',
          "Not every year brings a performance like that. This one did, and it's worth remembering.",
          "Congratulations, Bag of Three. Who's next on the list?",
        ],
      },
    ],
  },
  centurion: {
    recognition: 'Passed 100 career goals',
    personality: "Longevity, consistency, appetite and a career's worth of finishing.",
    variations: [
      {
        title: 'Triple Figures',
        paragraphs: [
          'One hundred goals. Take a moment with that number, because it deserves one.',
          'Every one of them needed a run, a chance and the nerve to put it away. Some were brilliant, some were scrappy, some went in off a shin, and every single one counted.',
          "Reaching three figures isn't about one great season. It's about turning up, week after week, year after year, and keeping that hunger for goals alive the whole time.",
          "That's not a hot streak. That's a career.",
          "Congratulations, Centurion. Here's to the next hundred.",
        ],
      },
      {
        title: 'The Long Game',
        paragraphs: [
          'Some milestones arrive in a single afternoon. This one took season after season of turning up and finishing chances.',
          'Week by week, goal by goal, the tally kept climbing. Through good runs and quiet spells, through new teammates and old rivals, it kept going up.',
          'Very few players at Astro will ever see their name next to a number this big.',
          "It's a record of commitment as much as talent, and you should be proud of both.",
          'Congratulations, Centurion. The century is yours.',
        ],
      },
      {
        title: 'A Hundred Moments',
        paragraphs: [
          'Behind the number are a hundred moments: a hundred celebrations, a hundred times the net rippled, a hundred times your teammates came running.',
          "Some of them you'll remember forever. Some of them you've probably forgotten already. All of them got you here.",
          'It takes a special kind of consistency to keep scoring for this long. Defenders changed, teams changed, and you just kept finding the net.',
          'Astro has seen a lot of goals. A hundred of them were yours.',
          'Congratulations, Centurion. What a milestone.',
        ],
      },
    ],
  },
  'clean-freak': {
    recognition: 'Most clean sheets of the year',
    personality: 'Discipline, reliability, composure and a deep dislike of conceding.',
    variations: [
      {
        title: 'The Shutout Specialist',
        paragraphs: [
          'Goals win matches. Clean sheets win arguments.',
          'This year, nobody kept the opposition out more often than you.',
          'Week after week, the back of your net stayed exactly as tidy as you like it. The saves, the blocks, the organising and the shouting all played their part.',
          "It's easy to overlook the games where nothing happens at the back. It's much harder to make sure nothing happens, again and again, across a whole year.",
          'Congratulations, Clean Freak. Spotless.',
        ],
      },
      {
        title: 'Counting Zeros',
        paragraphs: [
          "Some players count their goals. You've spent the year counting zeros.",
          'The concentration to stay switched on when the game drifts, the courage to put your body in the way and the composure to see out every last minute. It has all added up to a year full of shutouts.',
          "Strikers came looking for a way through. More often than anyone else's, your net told them no.",
          'That kind of consistency is the foundation everything else is built on.',
          'Congratulations, Clean Freak. The net thanks you.',
        ],
      },
      {
        title: 'Allergic to Conceding',
        paragraphs: [
          'Some people take defeat personally. You take conceding personally.',
          "It shows. This year, you've finished more games without letting one in than anyone else at Astro.",
          'Clean sheets rarely get the loudest celebrations, but every one of them is a small victory of concentration, teamwork and stubbornness.',
          "You've collected more of those small victories than anyone, and together they make a big one.",
          'Congratulations, Clean Freak. Keep it tidy.',
        ],
      },
    ],
  },
  'main-character': {
    recognition: 'Most Man of the Match wins',
    personality: 'Presence, influence, flair and a habit of owning the big moments.',
    variations: [
      {
        title: 'The Lead Role',
        paragraphs: [
          'Every Sunday has a standout performer. This year, it kept turning out to be you.',
          'More Man of the Match awards than anyone else means one thing: whenever your teammates were asked who made the difference, your name came up again and again.',
          "That's not one great game. That's a pattern of turning up, taking responsibility and making things happen when it matters.",
          'The spotlight found you because you kept earning it.',
          'Congratulations, Main Character.',
        ],
      },
      {
        title: 'Top of the Bill',
        paragraphs: [
          "Some players have good games. You've had a good year of them.",
          'Vote after vote, matchday after matchday, the verdict stayed remarkably consistent.',
          "Goals, assists, tackles, energy: the way you won those votes changed from week to week, but the result didn't.",
          "You weren't just in the story this year. You were the story.",
          'Congratulations, Main Character. Take a bow.',
        ],
      },
      {
        title: 'Every Scene Stealer',
        paragraphs: [
          'Every great story needs a lead. At Astro this year, the role was filled early and never really given up.',
          'Whenever a game needed someone to grab it, you seemed to be the one with the ball at your feet and an idea in your head.',
          'Your teammates noticed. They noticed so often that you finished the year with more Man of the Match awards than anyone else.',
          "That's the kind of recognition you can't fake. It's earned one Sunday at a time.",
          'Congratulations, Main Character. The year was written around you.',
        ],
      },
    ],
  },
  'new-month-same-me': {
    recognition: 'Won the same monthly award two months running',
    personality: 'Form, consistency and the rare knack of doing it all again.',
    variations: [
      {
        title: 'Same Again',
        paragraphs: [
          'Winning a monthly award is hard. Winning the same one the very next month is something else entirely.',
          'Everyone knew who to watch. Defenders paid closer attention, the bar went up, and you cleared it anyway.',
          'It means turning up Sunday after Sunday for two months straight and keeping the standard where it was.',
          'This badge is a reminder that, for two months running, you were the one everybody else was chasing.',
          'Congratulations, New month, same me.',
        ],
      },
      {
        title: 'Back to Back',
        paragraphs: [
          'Form comes and goes for most of us. Yours arrived, stayed for the month, then signed on for another.',
          'The touches were sharper, the decisions were quicker and the results followed, twice.',
          'One monthly award could be a hot streak. The same award two months in a row is a pattern.',
          "Here's to making it three.",
          'Congratulations, New month, same me.',
        ],
      },
      {
        title: 'Same Me, Better Month',
        paragraphs: [
          'Every player has a month they look back on fondly. You had two in a row, with the same silverware both times.',
          "A monthly award isn't won in one game. Defending one means doing it all over again with everyone now watching.",
          'You managed that, and you did it well enough to finish on top again.',
          "That's worth a badge of its own, and now you have one.",
          'Congratulations, New month, same me. Same again soon?',
        ],
      },
    ],
  },
  'sunday-disciple': {
    recognition: 'Played every matchday of the year',
    personality: 'Commitment, reliability, love of the game and an unbreakable Sunday routine.',
    variations: [
      {
        title: 'The Faithful',
        paragraphs: [
          'Rain, cold, early starts, late nights and tired legs. None of it kept you away.',
          'This year, you turned up for every single matchday, and that is a lot rarer than it sounds.',
          'Life gets in the way for most people. Weddings, work, holidays and the occasional Saturday night that went on longer than planned. Somehow, Sunday always won.',
          "That kind of commitment is what keeps Astro going. Teams get picked, games get played, and you're always part of them.",
          'Congratulations, Sunday Disciple. See you next week. Obviously.',
        ],
      },
      {
        title: 'Never Missed a Sunday',
        paragraphs: [
          'Some players have great feet. Some have great vision. You have something rarer: a perfect attendance record.',
          'Every matchday of the year, your name was on the team sheet.',
          "It's easy to underestimate what that takes. It means planning around the game, protecting your Sundays and turning up even when the forecast says stay in bed.",
          'Astro is built by people who keep turning up. This year, nobody turned up more reliably than you.',
          'Congratulations, Sunday Disciple. The pitch would feel empty without you.',
        ],
      },
      {
        title: 'The Ritual',
        paragraphs: [
          "For some people, Sunday is a day of rest. For you, it's a fixture.",
          'Boots in the bag, water bottle filled, out of the door. Every week, all year, without fail.',
          'Not every game was a classic, and not every result went your way. But you were there for all of them, and that matters more than any single performance.',
          "Being dependable is underrated. This badge is here to make sure it isn't.",
          'Congratulations, Sunday Disciple. Same time next week.',
        ],
      },
    ],
  },
  'most-capped': {
    recognition: 'Most appearances of the year',
    personality: 'Availability, durability, dedication and showing up when it counts.',
    variations: [
      {
        title: 'Always Available',
        paragraphs: [
          'The best ability, they say, is availability.',
          'This year, nobody pulled on the bib more often than you.',
          "That takes fitness, commitment and a fair bit of rearranging the rest of your life around a game of football. It also takes a love of playing that doesn't fade when the weather turns.",
          'Game after game, you were part of it, and Astro was better for having you there.',
          'Congratulations, Most Capped.',
        ],
      },
      {
        title: 'The Regular',
        paragraphs: [
          "Look down any team sheet from this year and there's a very good chance your name is on it.",
          "More appearances than anyone else isn't an accident. It's the result of saying yes, week after week, when it would have been easier to say not this time.",
          'Every game you played gave someone a teammate, gave a squad its numbers and gave the day its football.',
          'Reliability like that keeps everything running.',
          'Congratulations, Most Capped. The shirt is practically yours.',
        ],
      },
      {
        title: 'Part of the Furniture',
        paragraphs: [
          'There are players who come and go, and then there are players who are simply always there.',
          'This year, you were the second kind more than anyone else.',
          'Appearance after appearance, you built the kind of record that only comes from genuine commitment to the game and the people you play it with.',
          'You may not remember every one of those games. Everyone else will remember you were in them.',
          "Congratulations, Most Capped. Here's to many more.",
        ],
      },
    ],
  },
  'early-bird': {
    recognition: 'First to claim a weekly spot most often',
    personality: 'Eagerness, quick fingers and the joy of never missing out.',
    variations: [
      {
        title: 'First Off the Mark',
        paragraphs: [
          "The spots open. The notification arrives. And before most people have even unlocked their phones, you're already in.",
          'This year, nobody claimed their place first more often than you.',
          "It might look like quick fingers, but it's really something else: genuine excitement for the game, every single week.",
          "There's no hesitation, no checking the forecast, no waiting to see who else is playing. You just want to play.",
          'Congratulations, Early Bird. The worm never stood a chance.',
        ],
      },
      {
        title: 'Already In',
        paragraphs: [
          "Some players check if there's space. You make sure there's space for you.",
          'Week after week, you were first through the door when the spots went live, and you did it more often than anyone else at Astro.',
          "It's a small thing, but it says a lot. Nobody looks forward to Sunday more than you do.",
          'Keep those notifications on. Everyone else is still trying to catch you.',
          'Congratulations, Early Bird.',
        ],
      },
      {
        title: 'Never Late to the Party',
        paragraphs: [
          "Every week there's a rush when the spots go live. Every week, you seem to be at the front of it.",
          "Being first doesn't win matches, but it does say something about how much you want to be there.",
          'This year, you claimed your place first more often than anyone else, and you never once had to worry about missing out.',
          'That kind of enthusiasm is infectious, and Astro is better for it.',
          'Congratulations, Early Bird. See you at the front of the queue.',
        ],
      },
    ],
  },
  'good-standing': {
    recognition: 'Paid every quarter on time',
    personality: 'Reliability, respect for the group and quietly keeping things running.',
    variations: [
      {
        title: 'The Reliable One',
        paragraphs: [
          "Pitches don't book themselves, and balls don't buy themselves.",
          'Behind every matchday is a pot of money that keeps everything running, and this year, you paid into it on time, every time.',
          "It's not glamorous. Nobody celebrates a payment the way they celebrate a goal. But without it, there would be no goals to celebrate.",
          'The treasurer would like a word, and the word is thank you.',
          'Congratulations, Good Standing.',
        ],
      },
      {
        title: 'Paid in Full',
        paragraphs: [
          'No reminders. No chasing. No awkward messages in the group chat.',
          'Every quarter of the year, settled on time.',
          'It sounds simple, but anyone who has ever had to collect money from a group of footballers knows exactly how rare it is.',
          "You've made life easier for the people keeping Astro going, and that deserves to be recognised.",
          'Congratulations, Good Standing. Astro runs on people like you.',
        ],
      },
      {
        title: 'Quietly Brilliant',
        paragraphs: [
          'Some contributions happen on the pitch. Others happen in a banking app on a Tuesday evening.',
          'This year, yours happened on time, every quarter, without anyone having to ask twice.',
          'That reliability keeps the pitches booked, the kit in order and the matchdays happening.',
          "It's the kind of thing that only gets noticed when it's missing. So consider it noticed.",
          'Congratulations, Good Standing. Thank you for keeping the lights on.',
        ],
      },
    ],
  },
  trending: {
    recognition: 'Most tagged in the group chat',
    personality: 'Personality, presence and being impossible to leave out of the conversation.',
    variations: [
      {
        title: 'The Talk of the Group',
        paragraphs: [
          'Goals, moments, jokes, debates and the occasional controversy. Somehow, every conversation found its way back to you.',
          'This year, nobody was tagged in the group chat more often.',
          'Whether it was praise for a great finish, banter about a missed one or a demand for an explanation, people wanted you involved.',
          "That's a sign of something important: you're part of what makes Astro feel like Astro.",
          'Congratulations, Trending.',
        ],
      },
      {
        title: "Everybody's Talking",
        paragraphs: [
          "You can't buy this kind of attention. You have to earn it, one moment at a time.",
          'On the pitch or off it, you gave the group plenty to talk about this year, and the group took full advantage.',
          'Some of those tags were compliments. Some of them were definitely not. All of them meant people were thinking about you.',
          'Being the centre of the conversation is its own kind of award, and now it comes with a badge.',
          'Congratulations, Trending. Your notifications have been through a lot.',
        ],
      },
      {
        title: 'Impossible to Ignore',
        paragraphs: [
          'Every group chat has someone who seems to be in the middle of everything. This year, at Astro, that was you.',
          'A great goal, a strange decision, a story from the weekend or a photo nobody asked for. Whatever it was, it got people typing your name.',
          'Being talked about this much takes personality, and you clearly have plenty of it.',
          'Keep giving people reasons to tag you. It keeps the group alive between Sundays.',
          "Congratulations, Trending. The chat wouldn't be the same without you.",
        ],
      },
    ],
  },
  'heart-of-the-team': {
    recognition: 'Chosen by the admins for team spirit',
    personality: 'Spirit, generosity, encouragement and making everyone around you better.',
    variations: [
      {
        title: 'The Heartbeat',
        paragraphs: [
          'Not everything that matters shows up in the numbers.',
          'The encouragement after a mistake, the effort when the game is already lost, the welcome for new faces and the energy you bring every single week. People notice, even when nobody is keeping score.',
          "Teams are made of more than goals and assists. They're made of the people who make it a pleasure to turn up.",
          'This year, the admins wanted to recognise the person who did that best.',
          'Congratulations, Heart of the Team.',
        ],
      },
      {
        title: 'The Glue',
        paragraphs: [
          'Every group needs someone who holds it together.',
          "Someone who lifts heads after a heavy defeat, celebrates everyone's goals as if they were their own and makes Sunday feel like the best part of the week.",
          "You don't need the ball at your feet to make a difference. You've proved that all year.",
          'This year, that someone was you, and Astro is better for it.',
          'Congratulations, Heart of the Team. Astro is better with you in it.',
        ],
      },
      {
        title: 'More Than a Player',
        paragraphs: [
          "Some contributions can't be measured. They can only be felt.",
          "The way you speak to teammates, the way you treat opponents and the way you make newcomers feel like they've been here for years. It all adds up to something special.",
          "Football is better when people enjoy playing it together, and you've made sure that happens.",
          "The admins chose you for this one, and there wasn't much debate.",
          'Congratulations, Heart of the Team. Thank you for everything you bring.',
        ],
      },
    ],
  },
  'card-collector': {
    recognition: 'Most cards of the year',
    personality: 'Commitment, competitiveness and a slightly complicated relationship with referees.',
    variations: [
      {
        title: 'Fully Committed',
        paragraphs: [
          'Some players go into every challenge with care. You go into every challenge.',
          'This year, the referees noticed. More than once.',
          'Nobody can question your commitment. Your timing, perhaps, and occasionally your angle of approach, but never your commitment.',
          "Every team needs someone who refuses to let the opposition have an easy afternoon. You've taken that job very seriously.",
          'Congratulations, Card Collector. Maybe ease off a touch next year.',
        ],
      },
      {
        title: 'The Collection',
        paragraphs: [
          "Some people collect stamps. Some collect stickers. You've gone for something far more colourful.",
          'This year, nobody picked up more cards than you.',
          'Each one came with a story, a protest and probably a raised hand insisting you got the ball first.',
          'Wear this badge with pride, and maybe a little more caution next season.',
          'Congratulations, Card Collector.',
        ],
      },
      {
        title: 'Competitive Spirit',
        paragraphs: [
          'Wanting to win is a good thing. Wanting to win every single tackle is a slightly more expensive thing.',
          'This year, your competitive edge earned you more cards than anyone else at Astro.',
          "There's something to admire in a player who never takes a backwards step, even if the referee doesn't always share that admiration.",
          'Keep the fire. Maybe just turn it down a notch.',
          'Congratulations, Card Collector. The book has your name in it.',
        ],
      },
    ],
  },
  silverware: {
    recognition: 'Won the Salami Cup',
    personality: 'Teamwork, nerve, belief and finishing the job when it matters most.',
    variations: [
      {
        title: 'The Winners',
        paragraphs: [
          'Every squad turned up to the Salami Cup believing this could be their day. Only one of them could be right.',
          'Yours was.',
          'The plan, the effort, the last-ditch tackles and the celebrations on the touchline. It all came together when it mattered most, and you finished the day as champions.',
          'The Salami Cup is yours to hold until someone takes it from you, and everyone else is already working out how.',
          'Congratulations. That is Silverware.',
        ],
      },
      {
        title: 'Champions',
        paragraphs: [
          "Cups aren't won by one player. They're won by a squad that refuses to give up on each other.",
          'This time, that squad was yours.',
          'Every game brought new pressure and a new opponent desperate to stop you. Every time, you found a way.',
          "Enjoy every moment of holding it. Bragging rights like these don't come around often.",
          'Congratulations on the Silverware.',
        ],
      },
      {
        title: 'In Memory, In Glory',
        paragraphs: [
          "The Salami Cup means something more than a trophy. It's played in a name that matters to everyone at Astro.",
          'Winning it is special, and this time, the honour belongs to your squad.',
          'You played with spirit, with togetherness and with the kind of determination that makes a day like this one worth remembering.',
          'Your names go on the roll of honour, alongside everyone who came before you.',
          'Congratulations. Silverware, well earned.',
        ],
      },
    ],
  },
  'cup-hero': {
    recognition: 'Top scorer across the Salami Cup',
    personality: 'Nerve, sharpness and scoring when the stakes are highest.',
    variations: [
      {
        title: 'Big Game Player',
        paragraphs: [
          "Scoring on a normal Sunday is one thing. Scoring when there's a cup on the line is something else.",
          'Across the Salami Cup, nobody found the net more often than you.',
          'When the pressure rose, the legs got heavy and every chance felt like it might decide the day, you kept your head and kept finishing.',
          "That's what big game players do. They turn up when it counts.",
          'Congratulations, Cup Hero.',
        ],
      },
      {
        title: 'The Cup Scorer',
        paragraphs: [
          'Some players save their best for the big occasion.',
          "You turned up at the Salami Cup and gave the goalkeepers a day they'd rather forget.",
          'Different opponents, different squads, same result: the ball kept ending up in the net, and you kept being the one who put it there.',
          'The tournament had plenty of moments. A lot of them belonged to you.',
          'Congratulations, Cup Hero. The tournament belonged to your boots.',
        ],
      },
      {
        title: 'Golden Moments',
        paragraphs: [
          'Every cup has its heroes. This time, the goals made it obvious who one of them was.',
          'You led the scoring across the whole Salami Cup, which means more chances taken, more celebrations led and more defenders sent home thinking about you.',
          'Cup football rewards the brave and the clinical. You were both.',
          "That's a performance worth remembering long after the trophy has moved on.",
          'Congratulations, Cup Hero. What a tournament.',
        ],
      },
    ],
  },
  'cup-mvp': {
    recognition: 'Best player of the Salami Cup',
    personality: 'Leadership, quality, influence and rising to the occasion.',
    variations: [
      {
        title: 'Player of the Tournament',
        paragraphs: [
          'A cup is a long day. Different opponents, tired legs and moments that can decide everything.',
          'Through all of it, you stood out.',
          'Not just for one great game or one great goal, but for the way you influenced every match you played in and lifted everyone around you.',
          'The admins watched every game, and one name kept rising to the top of the conversation.',
          'Congratulations, Cup MVP.',
        ],
      },
      {
        title: 'The Standout',
        paragraphs: [
          'Trophies get lifted by squads, but every tournament has a player people remember.',
          'At this Salami Cup, that player was you.',
          'The quality on the ball, the work off it and the way you seemed to grow into the bigger moments made you impossible to ignore.',
          "There's no higher individual honour on cup day.",
          'Congratulations, Cup MVP. That was a performance.',
        ],
      },
      {
        title: 'Rising to the Occasion',
        paragraphs: [
          'Some players feel the pressure of a cup. Others seem to feed off it.',
          'You were very much the second kind.',
          'Game after game, you set the standard: competing for every ball, making the right decisions and producing moments that changed results.',
          'When it came to choosing the best player of the tournament, it was a short discussion.',
          'Congratulations, Cup MVP. The day was yours.',
        ],
      },
    ],
  },
  'iron-curtain': {
    recognition: 'Best defence at the Salami Cup',
    personality: 'Organisation, sacrifice, communication and defending as one.',
    variations: [
      {
        title: 'The Wall',
        paragraphs: [
          'Every squad at the Salami Cup had attackers who wanted to make their mark. Your squad made sure very few of them did.',
          'Fewest goals conceded across the whole tournament. That takes organisation, effort and everyone doing their bit without the ball.',
          'It means strikers tracking back, midfielders filling gaps and defenders winning every duel they could reach.',
          'Defending is a team sport, and at this cup, you played it better than anyone.',
          'Congratulations, Iron Curtain.',
        ],
      },
      {
        title: 'Shut Out',
        paragraphs: [
          'The best attacks of the tournament came up against your squad and found the door closed.',
          "Blocks, saves, last-ditch tackles and a lot of shouting. It wasn't always pretty, but it worked.",
          "Nobody at the Salami Cup was harder to score against, and that's a badge every player in the squad has earned together.",
          'Goals win games. Defences like this win respect.',
          'Congratulations, Iron Curtain. Nobody found a way through.',
        ],
      },
      {
        title: 'Hold the Line',
        paragraphs: [
          'Cup days are long and chaotic. Legs tire, concentration slips and goals start to fly in.',
          'Not against you.',
          'Your squad stayed compact, stayed switched on and stayed stubborn from the first game to the last.',
          'When the final tally came in, nobody had conceded fewer, and everyone in your squad deserves the credit.',
          'Congratulations, Iron Curtain. The line held.',
        ],
      },
    ],
  },
  firepower: {
    recognition: 'Most goals at the Salami Cup',
    personality: 'Attacking intent, confidence and an appetite for goals.',
    variations: [
      {
        title: 'All Guns Blazing',
        paragraphs: [
          'Some squads try to control the game. Yours tried to win it by as much as possible.',
          'No squad scored more at the Salami Cup.',
          'Every pass looked for the next chance, every chance looked for the net, and the net was found plenty of times.',
          'It was bold, it was fun to watch and it left a lot of goalkeepers shaking their heads.',
          'Congratulations, Firepower.',
        ],
      },
      {
        title: 'Goals Galore',
        paragraphs: [
          'Defenders across the tournament will be having nightmares about your squad for a while.',
          'The most goals of the Salami Cup, scored with confidence, flair and very little mercy.',
          'Everyone chipped in. The runs, the passes and the finishes added up to an attack nobody could keep quiet.',
          "That's the kind of football people turn up to watch.",
          'Congratulations, Firepower. That was entertainment.',
        ],
      },
      {
        title: 'Never Take the Foot Off',
        paragraphs: [
          "One goal is never enough when you're having fun.",
          'Your squad went into every game looking for more, and more is exactly what you found.',
          'By the end of the Salami Cup, nobody had scored as many, and the scoreboard told the story of a squad that loved to attack.',
          'Goals are the best part of football, and you gave the tournament plenty of them.',
          'Congratulations, Firepower. Keep shooting.',
        ],
      },
    ],
  },
  'back-to-back': {
    recognition: 'Won the Salami Cup two in a row, or more',
    personality: 'Hunger, consistency and the refusal to let go of the trophy.',
    variations: [
      {
        title: 'Defending Champions',
        paragraphs: [
          'Winning a cup is hard. Winning it again, with every other squad desperate to take it from you, is harder still.',
          "You've done it.",
          'It takes a special kind of hunger to come back after lifting a trophy and want it just as much as the first time.',
          'The trophy came back to you, and the target on your back just got even bigger.',
          'Congratulations, Back to Back.',
        ],
      },
      {
        title: 'Not Letting Go',
        paragraphs: [
          'Last time, you lifted the Salami Cup. This time, you made sure nobody else got their hands on it.',
          "Consecutive cup wins. That's not luck. That's a habit.",
          'New squads, new opponents and new pressure, and the same result at the end of the day.',
          'Every other player at Astro now knows exactly who they have to beat.',
          "Congratulations, Back to Back. Who's going to stop you?",
        ],
      },
      {
        title: 'Dynasty in the Making',
        paragraphs: [
          'One cup can be a great day. Two in a row starts to look like an era.',
          "You've won the Salami Cup again, straight after winning the last one, and that puts you in rare company.",
          "Consistency at this level means turning up with the same focus and the same fight, no matter how many times you've done it before.",
          'Enjoy it. Then start thinking about the next one.',
          'Congratulations, Back to Back.',
        ],
      },
    ],
  },
  'ever-present': {
    recognition: 'Played every Salami Cup of the year',
    personality: 'Commitment, enthusiasm and never missing the big occasion.',
    variations: [
      {
        title: 'Every Single One',
        paragraphs: [
          'Every Salami Cup of the year. Every squad draft. Every early start and every long day.',
          'You were there for all of them.',
          'Cups need players who show up, ready to compete and ready to make it an occasion. You did that each and every time.',
          "Whether your squad went home with the trophy or not, you were part of every chapter of this year's story.",
          'Congratulations, Ever-present.',
        ],
      },
      {
        title: 'Never Missed a Cup',
        paragraphs: [
          'Some players pick their tournaments. You entered them all.',
          'Win, lose or draw, you were part of every Salami Cup this year.',
          "That says something about what the cup means to you, and about the name it's played in.",
          "Showing up is the first step to every great memory, and you've made sure you never missed one.",
          "Congratulations, Ever-present. Save the date for next year's.",
        ],
      },
      {
        title: 'Part of Every Story',
        paragraphs: [
          "When people look back on this year's Salami Cups, you'll be in every one of the memories.",
          'Every draft, every squad, every final whistle. You were there.',
          'Commitment like that keeps the cup special. It turns a fixture into a tradition.',
          'This badge is a thank you for making sure it never went ahead without you.',
          'Congratulations, Ever-present.',
        ],
      },
    ],
  },
  'wooden-spoon': {
    recognition: 'Finished bottom of the Salami Cup',
    personality: 'Good humour, resilience and turning up anyway.',
    variations: [
      {
        title: "There's Always Next Time",
        paragraphs: [
          'Someone has to finish last. This time, it was your squad.',
          'But you turned up, you played every game and you took every defeat on the chin. That deserves a badge too.',
          "Football isn't only about winning. It's about the laughs, the effort and coming back for more.",
          'Hold this spoon with pride, and remember that every great comeback story has to start somewhere.',
          'Congratulations, Wooden Spoon. Mostly.',
        ],
      },
      {
        title: 'Character Building',
        paragraphs: [
          "The results didn't go your way. The goals didn't go in. The table wasn't kind.",
          'But nobody at the Salami Cup worked harder for less reward.',
          "There's a lot of character in a squad that keeps running when the scoreboard has stopped being friendly.",
          "Wear the Wooden Spoon with a smile. Next cup, it's someone else's turn.",
          'Congratulations, Wooden Spoon. Onwards and upwards.',
        ],
      },
      {
        title: 'The Only Way Is Up',
        paragraphs: [
          'Every tournament has a top and a bottom. This time, your squad got to see the view from below.',
          "It's not the trophy anyone wants, but it's one that every great team has held at some point.",
          'You gave everything, kept your heads up and made the day better for being in it.',
          "The good news is simple: from here, there's only one direction to go.",
          'Congratulations, Wooden Spoon. See you at the next cup.',
        ],
      },
    ],
  },
  'month-player-of-the-month': {
    recognition: 'Best average rating of the month',
    personality: 'Consistency, quality and being the standout name week after week.',
    variations: [
      {
        title: 'A Month of Your Own',
        paragraphs: [
          'One good Sunday is a performance. A whole month of them is form.',
          "Across every matchday this month, nobody's ratings stayed higher than yours.",
          'Your teammates kept scoring you well because you kept giving them reasons to: the work rate, the quality and the moments that made a difference.',
          'That kind of consistency is what separates a good month from a great one.',
          'Congratulations, Player of the Month.',
        ],
      },
      {
        title: 'In Form',
        paragraphs: [
          'Every few weeks, someone hits a run where everything seems to click.',
          'This month, that someone was you.',
          'The decisions were right, the touches were sharp and the ratings followed. Week after week, you set the standard.',
          'Enjoy it, and see if you can keep it going.',
          'Congratulations, Player of the Month.',
        ],
      },
      {
        title: 'The Month Belonged to You',
        paragraphs: [
          'Four or five Sundays. Different teams, different opponents, different conditions.',
          'The same name at the top.',
          'It takes real quality to perform at that level every single week, and you managed it better than anyone else this month.',
          'A month like that deserves to be remembered, and now it will be.',
          'Congratulations, Player of the Month. Keep raising the bar.',
        ],
      },
    ],
  },
  'month-golden-boot': {
    recognition: 'Most goals of the month',
    personality: 'Sharp finishing, confidence and a nose for goal.',
    variations: [
      {
        title: 'Hot Streak',
        paragraphs: [
          'Some months the goals just keep coming.',
          'This was one of those months for you. Nobody scored more.',
          'Every chance felt like it might go in, and an awful lot of them did. Tap-ins, strikes from distance and everything in between.',
          'Strikers live for months like this one. Make sure you enjoy it.',
          'Congratulations, Golden Boot. The goalkeepers will be glad to see the calendar turn.',
        ],
      },
      {
        title: 'On Target',
        paragraphs: [
          'Chance after chance, finish after finish, the goals piled up.',
          'By the end of the month, nobody at Astro had scored more.',
          'That takes sharp movement, good positioning and the confidence to shoot when others might pass.',
          'You found the net more often than anyone, and the month is yours because of it.',
          'Congratulations, Golden Boot.',
        ],
      },
      {
        title: 'The Net Kept Moving',
        paragraphs: [
          'For a month, it felt like every time you touched the ball near goal, something happened.',
          "That's what top scorers do. They make defenders nervous and goalkeepers busy.",
          'You finished the month with more goals than anyone else, and you earned every one of them.',
          'Next month, everyone will be watching to see if you can do it again.',
          'Congratulations, Golden Boot. Keep the boots warm.',
        ],
      },
    ],
  },
  'month-playmaker': {
    recognition: 'Most assists of the month',
    personality: 'Vision, generosity and seeing the pass before anyone else does.',
    variations: [
      {
        title: 'The Supplier',
        paragraphs: [
          'Goals got the cheers this month, but plenty of them started with you.',
          "Nobody set up more of their teammates' goals.",
          'The through balls, the crosses and the clever little passes that turned a half-chance into a celebration. You made all of them look easy.',
          'Your teammates got the glory. You got the satisfaction of knowing exactly who made it happen.',
          'Congratulations, Playmaker. The thank-you messages are in the post.',
        ],
      },
      {
        title: 'Pass Master',
        paragraphs: [
          'The through balls, the cutbacks and the perfectly timed passes. This month, you were the one making things happen.',
          'More assists than anyone else at Astro, and every one of them a gift to a teammate.',
          'Creating goals takes vision, patience and a generous streak. You showed all three.',
          'Keep picking them out. Your strikers are relying on you.',
          'Congratulations, Playmaker.',
        ],
      },
      {
        title: 'Eyes in the Back of Your Head',
        paragraphs: [
          'Some players see the pass. You seemed to see it before anyone else had even made the run.',
          'This month, that vision turned into more assists than anyone else managed.',
          "Every one of those goals had your fingerprints on it, even if your name wasn't the one being shouted.",
          'Football needs creators as much as finishers, and this month you were the best of them.',
          'Congratulations, Playmaker. Keep the ideas coming.',
        ],
      },
    ],
  },
  'month-golden-glove': {
    recognition: 'Most clean sheets of the month',
    personality: 'Safe hands, calm heads and an empty net to show for it.',
    variations: [
      {
        title: 'Safe Hands',
        paragraphs: [
          'This month, the back of your net stayed remarkably quiet.',
          'More clean sheets than anyone else, built on saves, organisation and concentration from start to finish.',
          'Clean sheets are often overlooked, but every one of them is a small masterpiece of discipline.',
          'You produced more of them this month than anyone at Astro.',
          'Congratulations, Golden Glove.',
        ],
      },
      {
        title: 'Locked Up',
        paragraphs: [
          'Strikers tried. Strikers failed.',
          'The month ended with more clean sheets for you than for anyone else.',
          'It took sharp reactions, brave decisions and a steady voice organising everyone in front of you.',
          'Keeping the ball out is a thankless job most weeks. This month, it gets the thanks it deserves.',
          'Congratulations, Golden Glove. Keep the gloves on.',
        ],
      },
      {
        title: 'Nothing Getting Past',
        paragraphs: [
          'Every team wants someone they can rely on at the back. This month, you were that someone more often than anyone else.',
          'Game after game, the opposition left without a goal to show for their efforts.',
          "That's a record built on focus, positioning and refusing to accept that any shot is unsavable.",
          'Clean sheets like these are the foundation of winning football.',
          'Congratulations, Golden Glove. Safe hands indeed.',
        ],
      },
    ],
  },
} satisfies Record<string, AwardCopy>)

/** A different variation from the current one, when there's more than one. */
export function pickVariation(count: number, current?: number) {
  if (count <= 1) return 0
  if (current === undefined) return Math.floor(Math.random() * count)
  const next = Math.floor(Math.random() * (count - 1))
  return next >= current ? next + 1 : next
}
