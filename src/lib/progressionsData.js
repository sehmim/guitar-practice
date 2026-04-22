export const ROMAN = {
  Major: ['I','ii','iii','IV','V','vi','vii°'],
  Minor: ['i','ii°','III','iv','v','VI','VII'],
};

export function degLabel(degree, scaleType) { return ROMAN[scaleType]?.[degree - 1] ?? degree; }

export const PROGRESSIONS = {
  Major: [
    {
      genre: 'Pop',
      items: [
        { name: 'I–V–vi–IV', degrees: [1,5,6,4], songs: ['Let It Be', 'With or Without You', 'Payphone', 'Don\'t Stop Believin\'', 'Someone Like You (major key)'] },
        { name: 'I–vi–IV–V', degrees: [1,6,4,5], songs: ['Stand By Me', 'Earth Angel', 'Blue Moon', 'Every Breath You Take'] },
        { name: 'vi–IV–I–V', degrees: [6,4,1,5], songs: ['Apologize', 'Pompeii', 'Let Her Go', 'Royals'] },
        { name: 'I–IV–V', degrees: [1,4,5], songs: ['La Bamba', 'Twist and Shout', 'Johnny B. Goode'] },
        { name: 'I–IV–vi–V', degrees: [1,4,6,5], songs: ['Africa (Toto)', 'Lean On Me', 'Take On Me'] },
      ],
    },
    {
      genre: 'Rock',
      items: [
        { name: 'I–IV–V', degrees: [1,4,5], songs: ['Louie Louie', 'Wild Thing', 'Good Riddance'] },
        { name: 'I–V–IV', degrees: [1,5,4], songs: ['Free Fallin\'', 'Brown Eyed Girl', 'Knockin\' on Heaven\'s Door'] },
        { name: 'I–IV–I–V', degrees: [1,4,1,5], songs: ['Rock Around the Clock', 'Johnny B. Goode'] },
        { name: 'I–V–vi–iii–IV', degrees: [1,5,6,3,4], songs: ['Canon Rock', 'Axis of Awesome songs'] },
        { name: 'I–iii–IV–V', degrees: [1,3,4,5], songs: ['House of the Rising Sun (intro)', 'Piano Man'] },
      ],
    },
    {
      genre: 'Blues',
      items: [
        { name: '12-Bar Blues (A)', degrees: [1,1,1,1,4,4,1,1], songs: ['Hound Dog', 'Johnny B. Goode', 'Blue Suede Shoes'] },
        { name: 'Blues Turnaround', degrees: [1,4,1,5], songs: ['Everyday Blues', 'Kansas City'] },
        { name: 'Quick-Change Blues', degrees: [1,4,1,1,4,4,1,5], songs: ['Quick Change 12-Bar variant'] },
        { name: 'Blues Shuffle', degrees: [1,4,5,4], songs: ['Pride and Joy', 'Crossroads'] },
      ],
    },
    {
      genre: 'Jazz',
      items: [
        { name: 'ii–V–I', degrees: [2,5,1], songs: ['Autumn Leaves', 'All The Things You Are', 'Misty'] },
        { name: 'I–vi–ii–V', degrees: [1,6,2,5], songs: ['I Got Rhythm', 'Rhythm Changes', 'Fly Me to the Moon'] },
        { name: 'iii–VI–ii–V', degrees: [3,6,2,5], songs: ['Autumn Leaves (B section)', 'Lady Bird'] },
        { name: 'I–IV–iii–vi', degrees: [1,4,3,6], songs: ['Heart and Soul', 'That\'s All'] },
        { name: 'I–IV–ii–V', degrees: [1,4,2,5], songs: ['Take the A Train (simplified)', 'Satin Doll'] },
      ],
    },
    {
      genre: 'R&B / Soul',
      items: [
        { name: 'I–vi–ii–V', degrees: [1,6,2,5], songs: ['A Change Is Gonna Come', 'My Girl (turnaround)'] },
        { name: 'I–IV–vi–V', degrees: [1,4,6,5], songs: ['Lean On Me', 'Lovely Day'] },
        { name: 'I–iii–IV–V', degrees: [1,3,4,5], songs: ['What\'s Going On', 'Mercy Mercy Me'] },
        { name: 'I–IV–I–V', degrees: [1,4,1,5], songs: ['Soul Finger', 'Mustang Sally'] },
      ],
    },
    {
      genre: 'Country',
      items: [
        { name: 'I–IV–V', degrees: [1,4,5], songs: ['Ring of Fire', 'Folsom Prison Blues', 'Wagon Wheel'] },
        { name: 'I–V–IV–V', degrees: [1,5,4,5], songs: ['Country Shuffle', 'On the Road Again'] },
        { name: 'I–IV–V–IV', degrees: [1,4,5,4], songs: ['Take Me Home Country Roads', 'Country Roads'] },
        { name: 'I–ii–IV–V', degrees: [1,2,4,5], songs: ['Modern Country', 'Thinking Out Loud (country)'] },
      ],
    },
    {
      genre: 'Folk',
      items: [
        { name: 'I–IV–V', degrees: [1,4,5], songs: ['This Land Is Your Land', 'Simple folk tunes'] },
        { name: 'I–V–vi–iii–IV', degrees: [1,5,6,3,4], songs: ['Pachelbel\'s Canon', 'Canon in D'] },
        { name: 'I–vi–IV–II', degrees: [1,6,4,2], songs: ['50s doo-wop', 'Teen ballads'] },
        { name: 'I–V–IV', degrees: [1,5,4], songs: ['The Sound of Silence', 'Mr. Tambourine Man'] },
      ],
    },
    {
      genre: 'Funk',
      items: [
        { name: 'I–IV', degrees: [1,4], songs: ['Superstition', 'Get Up (I Feel Like Being a) Sex Machine'] },
        { name: 'I–IV–V–IV', degrees: [1,4,5,4], songs: ['Higher Ground', 'Give It Up'] },
        { name: 'I–ii–IV–I', degrees: [1,2,4,1], songs: ['Funk groove staple'] },
      ],
    },
  ],
  Minor: [
    {
      genre: 'Rock',
      items: [
        { name: 'i–VII–VI–VII', degrees: [1,7,6,7], songs: ['Stairway to Heaven', 'Hotel California', 'Smoke on the Water'] },
        { name: 'i–VI–III–VII', degrees: [1,6,3,7], songs: ['Nothing Else Matters', 'Numb', 'Faded'] },
        { name: 'i–iv–VII–III', degrees: [1,4,7,3], songs: ['Creep', 'Mad World', 'Lithium'] },
        { name: 'i–VI–VII', degrees: [1,6,7], songs: ['Losing My Religion', 'Sultans of Swing', 'Zombie'] },
        { name: 'i–v–VI–VII', degrees: [1,5,6,7], songs: ['Pumped Up Kicks', 'Seven Nation Army'] },
      ],
    },
    {
      genre: 'Pop',
      items: [
        { name: 'i–VI–III–VII', degrees: [1,6,3,7], songs: ['Counting Stars', 'Radioactive', 'Demons'] },
        { name: 'i–VII–VI–VII', degrees: [1,7,6,7], songs: ['Wicked Game', 'Zombie', 'In the Air Tonight'] },
        { name: 'i–iv–i–V', degrees: [1,4,1,5], songs: ['Sail', 'Stay (Rihanna)'] },
        { name: 'i–VI–VII–i', degrees: [1,6,7,1], songs: ['Shape of You (partial)', 'Stitches'] },
      ],
    },
    {
      genre: 'Blues',
      items: [
        { name: 'Minor 12-Bar', degrees: [1,1,1,1,4,4,1,1], songs: ['The Thrill Is Gone', 'Stormy Monday'] },
        { name: 'i–iv–V', degrees: [1,4,5], songs: ['Minor blues shuffle', 'Spoonful'] },
        { name: 'i–VII–iv–V', degrees: [1,7,4,5], songs: ['Minor blues turnaround'] },
      ],
    },
    {
      genre: 'Jazz',
      items: [
        { name: 'ii°–V–i', degrees: [2,5,1], songs: ['Autumn Leaves', 'Summertime', 'Solar'] },
        { name: 'i–iv–VII–III', degrees: [1,4,7,3], songs: ['Minor jazz standard', 'Stolen Moments'] },
        { name: 'i–VI–III–VII', degrees: [1,6,3,7], songs: ['Minor jazz turnaround', 'Black Orpheus'] },
        { name: 'i–ii°–V–i', degrees: [1,2,5,1], songs: ['Autumn Leaves cadence', 'Fly Me to the Moon (minor)'] },
      ],
    },
    {
      genre: 'Metal',
      items: [
        { name: 'i–VII–VI–V', degrees: [1,7,6,5], songs: ['Andalusian Cadence', 'Eruption', 'Sultans of Swing solo'] },
        { name: 'i–VII–VI–VII', degrees: [1,7,6,7], songs: ['Iron Maiden style', 'Hallowed Be Thy Name'] },
        { name: 'i–iv–VII–VI', degrees: [1,4,7,6], songs: ['Paranoid', 'Iron Man', 'Sabbath-style'] },
        { name: 'i–VI–III–VII', degrees: [1,6,3,7], songs: ['Fade to Black', 'Master of Puppets'] },
      ],
    },
    {
      genre: 'R&B / Soul',
      items: [
        { name: 'i–VII–VI–VII', degrees: [1,7,6,7], songs: ['Mercy Mercy Me', 'Inner City Blues'] },
        { name: 'i–iv–VII–i', degrees: [1,4,7,1], songs: ['Neo-soul groove', 'Redbone (partial)'] },
        { name: 'i–VI–VII', degrees: [1,6,7], songs: ['R&B minor feel', 'Earned It'] },
      ],
    },
    {
      genre: 'Flamenco / Latin',
      items: [
        { name: 'i–VII–VI–V', degrees: [1,7,6,5], songs: ['Andalusian Cadence', 'Malagueña', 'Malaguena'] },
        { name: 'i–iv–V–i', degrees: [1,4,5,1], songs: ['Classical Flamenco', 'La Cumparsita'] },
        { name: 'i–VII–VI–VII–i', degrees: [1,7,6,7,1], songs: ['Spanish romance', 'Bamboleo'] },
      ],
    },
  ],
};
