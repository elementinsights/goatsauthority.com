export const categoryGuides: Record<string, {
  title: string;
  intro: string;
  sections: { heading: string; content: string; links?: { text: string; href: string }[] }[];
  faq: { question: string; answer: string }[];
}> = {
  'what-do-goats-eat': {
    title: 'The Complete Guide to What Goats Can and Can\'t Eat',
    intro: 'Goats are browsers, not grazers. Unlike sheep and cattle that eat mostly grass, goats prefer to nibble on a variety of plants, leaves, bark, and weeds. Understanding what goats can safely eat is one of the most important parts of goat ownership. A wrong food choice can cause bloat, poisoning, or even death. This guide covers everything you need to know about feeding your goats, with links to our detailed articles on specific foods.',
    sections: [
      {
        heading: 'Hay and Forage: The Foundation of a Goat\'s Diet',
        content: 'Hay should make up 75-80% of your goat\'s diet. The best hay options are Timothy hay, orchard grass, and alfalfa (especially for pregnant or lactating does). Goats also love browsing on brush, weeds, and tree leaves when available.',
        links: [
          { text: 'What Kind of Hay Do Goats Eat?', href: '/what-kind-of-hay-do-goats-eat/' },
          { text: 'Can Goats Eat Sticker Bushes?', href: '/can-goats-eat-sticker-bushes/' },
          { text: 'Can Goats Eat Laurel Leaves?', href: '/can-goats-eat-laurel-leaves/' },
        ],
      },
      {
        heading: 'Fruits and Vegetables Goats Can Eat',
        content: 'Most fruits and vegetables are safe for goats as treats. Apples, bananas, carrots, watermelon, and pumpkin are all goat favorites. Always remove seeds from fruits like apples, and introduce new foods gradually to avoid digestive upset.',
        links: [
          { text: 'Can Goats Eat Apples?', href: '/can-goats-eat-apples/' },
          { text: 'Can Goats Eat Corn?', href: '/can-goats-eat-corn/' },
          { text: 'Can Goats Eat Avocado?', href: '/can-goats-eat-avocado/' },
        ],
      },
      {
        heading: 'Foods That Are Toxic to Goats',
        content: 'Several common plants and foods are dangerous or fatal to goats. Rhododendron, azalea, cherry leaves (wilted), and nightshade are among the most toxic. Always check before introducing new plants to your goat\'s environment.',
        links: [
          { text: 'Can Goats Eat Laurel Leaves?', href: '/can-goats-eat-laurel-leaves/' },
        ],
      },
      {
        heading: 'Grain, Minerals, and Supplements',
        content: 'Goats need loose minerals formulated specifically for goats (not sheep or cattle minerals, as goats need copper). Grain should be given sparingly to avoid bloat and obesity. Pregnant and lactating does need extra nutrition.',
        links: [
          { text: 'Can Pregnant Goats Eat Medicated Feed?', href: '/can-pregnant-goats-eat-medicated-feed/' },
        ],
      },
      {
        heading: 'Goat Milk for Other Animals and Humans',
        content: 'Goat milk is highly nutritious and easier to digest than cow milk. It can be fed to orphaned kittens, puppies, and other animals. Humans also benefit from goat milk, especially those with lactose sensitivity.',
        links: [
          { text: 'Can a 1-Year-Old Drink Goat Milk?', href: '/can-1-year-old-drink-goats-milk/' },
          { text: 'Can Baby Kittens Drink Goat Milk?', href: '/can-baby-kittens-drink-goats-milk/' },
          { text: 'Can Dogs Have Goat Formula?', href: '/can-dogs-have-goat-formula/' },
          { text: 'Can Sheep Drink Raw Goat Milk?', href: '/can-sheep-drink-raw-goats-milk/' },
        ],
      },
    ],
    faq: [
      { question: 'What do goats eat on a daily basis?', answer: 'A goat\'s daily diet should be 75-80% hay or forage, supplemented with loose goat minerals and fresh water. Grain can be given in small amounts, especially to pregnant or lactating does. Treats like fruits and vegetables should make up no more than 10% of their diet.' },
      { question: 'What foods are poisonous to goats?', answer: 'Rhododendron, azalea, wilted cherry leaves, nightshade, and wild mushrooms are among the most toxic plants for goats. Avocado skin and pit, chocolate, and anything moldy should also be avoided.' },
      { question: 'Can goats eat everything?', answer: 'No. Despite the myth, goats are actually picky eaters. They prefer to browse on a variety of plants but will refuse food that smells bad or is contaminated. Many common plants are toxic to goats.' },
    ],
  },

  'health': {
    title: 'Goat Health Guide: Common Diseases, Symptoms, and Treatments',
    intro: 'Keeping your goats healthy requires knowing what to look for and acting quickly when something is wrong. Goats are prey animals and naturally hide illness, so by the time you notice symptoms, the problem may be advanced. This guide covers the most common goat health issues, vaccinations, deworming, and when to call the vet.',
    sections: [
      {
        heading: 'Vaccinations and Prevention',
        content: 'The CDT vaccine (Clostridium Perfringens Types C & D and Tetanus) is the most important vaccine for all goats. Kids should receive their first dose at 4-8 weeks, a booster 3-4 weeks later, and annual boosters after that. Pregnant does should be vaccinated 4 weeks before kidding.',
        links: [
          { text: 'Can a CDT Shot Kill a Goat?', href: '/can-a-cdt-shot-kill-a-goat/' },
          { text: 'Can I Worm My Three-Day-Old Goat?', href: '/can-i-worm-my-three-day-old-goat/' },
        ],
      },
      {
        heading: 'Parasites and Deworming',
        content: 'Internal parasites (particularly barber pole worm) are the number one killer of goats. Use the FAMACHA scoring system to check for anemia, and only deworm goats that need it to prevent resistance. Rotate dewormers and work with your vet on a parasite management plan.',
        links: [
          { text: 'Can I Use Ivermectin Pour-On for Goats?', href: '/can-i-use-ivermectin-pour-on-in-sheep-and-goats/' },
        ],
      },
      {
        heading: 'Common Diseases and Symptoms',
        content: 'Goats are susceptible to pneumonia, bloat, enterotoxemia, foot rot, and CAE (Caprine Arthritis Encephalitis). Learn to recognize the early signs: lethargy, loss of appetite, hunched posture, coughing, diarrhea, and limping are all red flags.',
        links: [
          { text: 'Can Goats Carry Distemper?', href: '/can-goats-carry-distemper/' },
          { text: 'Can a Goat Get Sick from Cold?', href: '/can-a-goat-get-sick-from-cold/' },
          { text: 'Can Goats Have a Stroke?', href: '/can-goats-have-a-stroke-anemia/' },
          { text: 'Can You Catch Diseases from Goats?', href: '/can-you-catch-diseases-from-goats/' },
        ],
      },
      {
        heading: 'Emergency Care and Home Remedies',
        content: 'Every goat owner should have a basic medical kit including a thermometer (normal goat temp is 101.5-103.5F), Pepto-Bismol for digestive issues, Benadryl for allergic reactions, and Nutri-Drench for weak goats. Know your vet\'s emergency number.',
        links: [
          { text: 'Can I Give My Goat Pepto-Bismol?', href: '/can-i-give-my-goat-pepto-bismol/' },
          { text: 'Can Benadryl Hurt a Goat?', href: '/can-benadryl-hurt-a-goat/' },
        ],
      },
    ],
    faq: [
      { question: 'What is the most common disease in goats?', answer: 'Internal parasites (especially barber pole worm/Haemonchus contortus) are the most common and deadly health issue in goats. Pneumonia, enterotoxemia, and foot rot are also very common.' },
      { question: 'How often should goats be dewormed?', answer: 'Goats should not be dewormed on a set schedule. Instead, use FAMACHA scoring to check for anemia and only deworm individual goats that show signs of parasite overload. This prevents parasite resistance.' },
      { question: 'What vaccinations do goats need?', answer: 'At minimum, all goats need the CDT vaccine (Clostridium Perfringens Types C & D and Tetanus). Kids get their first dose at 4-8 weeks with a booster 3-4 weeks later, then annual boosters. Your vet may recommend additional vaccines based on your area.' },
    ],
  },

  'breeding': {
    title: 'Goat Breeding Guide: From Mating to Kidding',
    intro: 'Whether you are raising goats for milk, meat, or companionship, understanding goat breeding is essential. This guide covers breed selection, the breeding cycle, pregnancy care, kidding (birth), and raising kids from birth to weaning.',
    sections: [
      {
        heading: 'Choosing the Right Breed',
        content: 'The best goat breed depends on your goals. Nigerian Dwarf and Nubian goats are excellent dairy breeds. Boer goats are the top meat breed. Pygmy goats are popular as pets. Each breed has different space requirements, temperaments, and care needs.',
        links: [
          { text: 'Can a Goat and Lamb Breed?', href: '/can-a-goat-and-lamb-breed/' },
          { text: 'Can a Goat Breed with Sheep?', href: '/can-a-goat-breed-with-sheep/' },
        ],
      },
      {
        heading: 'The Breeding Cycle',
        content: 'Does (female goats) come into heat every 18-21 days during breeding season (typically fall). Signs of heat include tail wagging, vocalization, decreased appetite, and swollen vulva. Most breeders use a buck (male goat) or artificial insemination.',
      },
      {
        heading: 'Pregnancy and Kidding',
        content: 'Goat pregnancy lasts about 150 days (5 months). Does typically give birth to 1-3 kids, though some breeds commonly have more. Prepare a clean, dry kidding area and know the signs of labor: restlessness, pawing at the ground, mucous discharge, and nesting behavior.',
        links: [
          { text: 'How Many Babies Do Goats Have at a Time?', href: '/how-many-babies-do-goats-have-at-a-time/' },
          { text: 'Can a Female Goat Produce Milk Without Being Pregnant?', href: '/can-a-female-goat-produce-milk-without-being-pregnant/' },
        ],
      },
      {
        heading: 'Raising Kids',
        content: 'Newborn kids need colostrum within the first hour of life. They can be dam-raised (nursing from mom) or bottle-fed. Kids should be disbudded at 3-7 days if you choose to remove horns, and bucks should be banded (castrated) at 8-12 weeks if not being kept for breeding.',
        links: [
          { text: 'Can a Goat Feed Quads?', href: '/can-a-goat-feed-quads/' },
          { text: 'Can 8-Week-Old Baby Goats Be in With Each Other?', href: '/can-8-week-old-baby-goats-be-in-with-each-other/' },
        ],
      },
    ],
    faq: [
      { question: 'How many babies do goats have?', answer: 'Most goats have 1-3 kids per pregnancy. Twins are the most common. Some breeds, like Nigerian Dwarf, frequently have triplets or even quadruplets.' },
      { question: 'How long are goats pregnant?', answer: 'Goat pregnancy (gestation) lasts approximately 150 days, or about 5 months.' },
      { question: 'Can goats breed with sheep?', answer: 'While goats and sheep can occasionally crossbreed, it is extremely rare and the offspring (called a geep or shoat) are almost always sterile. They are different species with different chromosome counts.' },
    ],
  },

  'food': {
    title: 'Goat Products: Milk, Cheese, Meat, and More',
    intro: 'Goats provide a wide range of products for human consumption and use. Goat milk is the most consumed milk worldwide, goat cheese is a gourmet staple, and goat meat (chevon) is the most widely eaten red meat globally. This guide covers how to get the most from your goats\' products.',
    sections: [
      {
        heading: 'Goat Milk',
        content: 'Goat milk is naturally homogenized, easier to digest than cow milk, and lower in lactose. Nigerian Dwarf goats produce the sweetest, highest-butterfat milk. A single dairy doe can produce 1-3 quarts per day depending on breed.',
      },
      {
        heading: 'Goat Cheese',
        content: 'Chevre (soft goat cheese) is the easiest cheese to make at home. All you need is goat milk, an acid (lemon juice or vinegar), and salt. More complex cheeses like feta and aged goat cheese require rennet and aging.',
      },
      {
        heading: 'Goat Meat',
        content: 'Goat meat is lean, high in protein, and lower in cholesterol than beef or chicken. Boer goats are the most popular meat breed. Kids are typically processed at 60-80 pounds for the tenderest meat.',
      },
    ],
    faq: [
      { question: 'Is goat milk better than cow milk?', answer: 'Goat milk has smaller fat globules making it easier to digest, contains less lactose, and has more vitamins A and B6. It is particularly beneficial for people with mild lactose sensitivity, though it is not suitable for those with a true dairy allergy.' },
      { question: 'What does goat meat taste like?', answer: 'Goat meat (chevon) has a mild, slightly sweet flavor similar to lamb but leaner. Young goat (kid) meat is the most tender. The flavor is influenced by diet, age, and breed.' },
    ],
  },

  'housing': {
    title: 'Goat Housing and Shelter: Everything You Need to Know',
    intro: 'Proper housing protects your goats from weather, predators, and disease. Goats need a dry, draft-free shelter with adequate ventilation. They do not need elaborate barns, but they do need protection from rain, wind, and extreme temperatures.',
    sections: [
      {
        heading: 'Basic Shelter Requirements',
        content: 'Plan for 15-20 square feet of indoor space per goat. The shelter should be draft-free at goat level but well-ventilated above. A three-sided shelter works in mild climates, while fully enclosed barns are better for cold or wet regions.',
        links: [
          { text: 'Can a Goat Barn Be 12x2?', href: '/can-a-goat-barn-be-12x-2/' },
          { text: 'Can Goats Be Kept in the House?', href: '/can-goats-be-kept-in-the-house/' },
        ],
      },
      {
        heading: 'Fencing',
        content: 'Goats are notorious escape artists. You need at least 4-foot fencing (5 feet for agile breeds). Woven wire, cattle panels, or electric fencing all work. Never use barbed wire for goats.',
        links: [
          { text: 'Can Goats Climb Fences?', href: '/can-goats-climb-fences/' },
        ],
      },
      {
        heading: 'Bedding and Maintenance',
        content: 'Pine shavings, straw, or hay all work as bedding. The deep litter method (adding fresh bedding on top of old) generates heat in winter and reduces labor. Clean out completely 2-4 times per year.',
        links: [
          { text: 'Can Pine Chips Be Used as Bedding?', href: '/can-pine-chips-be-used-as-bedding-for-goats/' },
          { text: 'Can a Goat Pen Have Pine Trees?', href: '/can-a-goat-pen-have-pine-trees-in-it/' },
        ],
      },
      {
        heading: 'Living With Other Animals',
        content: 'Goats can coexist with many farm animals including chickens, ducks, and horses. Dogs can be trained as livestock guardians. Keep goats separated from pigs as they can share parasites.',
        links: [
          { text: 'Can Dogs and Pygmy Goats Live Together?', href: '/can-dogs-and-pygmy-goats-live-together/' },
          { text: 'Can Ducks and Goats Coexist?', href: '/can-ducks-and-goats-coexist/' },
          { text: 'Can Goats, Pigs, and Chickens Live Together?', href: '/can-goats-pigs-and-chickens-live-in-the-same-barn/' },
        ],
      },
    ],
    faq: [
      { question: 'How much space do goats need?', answer: 'Plan for 15-20 square feet of indoor shelter space per goat and 200+ square feet of outdoor space per goat. More space is always better to reduce stress and disease.' },
      { question: 'Can goats live outside in winter?', answer: 'Goats can tolerate cold temperatures but must have a dry, draft-free shelter to escape rain, snow, and wind. Wet and windy conditions are far more dangerous to goats than cold alone.' },
    ],
  },

  'training': {
    title: 'Goat Training and Behavior: A Complete Guide',
    intro: 'Goats are intelligent, curious animals that respond well to positive reinforcement training. Whether you want to leash-train your goat, teach them to come when called, or manage behavioral issues like headbutting, consistent training makes life easier for both you and your goats.',
    sections: [
      {
        heading: 'Basic Training',
        content: 'Start training goats young. Kids that are handled frequently from birth grow into friendlier, more manageable adults. Use food rewards (raisins, animal crackers, or small pieces of apple) as positive reinforcement.',
        links: [
          { text: 'Can I Buy a Goat as a Pet?', href: '/can-i-buy-a-goat-as-a-pet/' },
        ],
      },
      {
        heading: 'Leash Training',
        content: 'Goats can be leash-trained starting at a few weeks old. Use a flat collar (not a chain) and a 6-foot lead. Start in a small area and reward the goat for walking with you. Most goats learn within a few sessions.',
      },
      {
        heading: 'Understanding Goat Behavior',
        content: 'Goats are herd animals and should never be kept alone. They establish a pecking order through head-butting and posturing. Provide enough food stations and space so lower-ranking goats are not bullied away from resources.',
      },
    ],
    faq: [
      { question: 'Can you keep a goat as a house pet?', answer: 'While some people do keep goats indoors temporarily, they are not true house pets. Goats cannot be house-trained reliably, they chew on everything, and they need outdoor space and herd companions to be happy.' },
      { question: 'How many goats should you have?', answer: 'Always keep at least two goats. They are herd animals and a single goat will be stressed, noisy, and destructive. Three or more is ideal.' },
    ],
  },

  'safety': {
    title: 'Goat Safety: Predators, Toxic Plants, and Escape Prevention',
    intro: 'Keeping your goats safe requires protection from predators, awareness of toxic plants, and secure fencing. Goats face threats from coyotes, dogs, mountain lions, and even eagles (for kids). This guide covers how to keep your herd safe.',
    sections: [
      {
        heading: 'Predator Protection',
        content: 'The most common goat predators are domestic dogs, coyotes, and foxes. Livestock guardian dogs (LGDs) like Great Pyrenees and Anatolian Shepherds are the most effective protection. Secure nighttime housing and good fencing are also essential.',
        links: [
          { text: 'Can a Fox Kill a Goat?', href: '/can-a-fox-kill-a-goat/' },
          { text: 'Can a Dog Get Sick from a Goat?', href: '/can-a-dog-get-sick-from-a-goat/' },
        ],
      },
      {
        heading: 'Toxic Plants to Remove',
        content: 'Walk your pasture and remove any toxic plants before introducing goats. Common toxic plants include rhododendron, azalea, mountain laurel, yew, and wilted cherry leaves. Even small amounts of some of these plants can be fatal.',
      },
      {
        heading: 'Escape Prevention',
        content: 'Goats are incredible escape artists. They can jump, climb, and squeeze through surprisingly small gaps. Use 4-5 foot woven wire or cattle panel fencing. Check for gaps at the bottom and corners regularly. Electric fencing can be added as a deterrent.',
        links: [
          { text: 'Can Goats Climb Trees?', href: '/can-a-goat-climb-trees/' },
          { text: 'Can Goats Climb Fences?', href: '/can-goats-climb-fences/' },
        ],
      },
    ],
    faq: [
      { question: 'What is the biggest threat to goats?', answer: 'Domestic dogs are the number one predator of goats in the US, followed by coyotes. Internal parasites are the number one health threat. Both can be managed with proper fencing, livestock guardian animals, and a good parasite management plan.' },
      { question: 'How do I keep my goats from escaping?', answer: 'Use at least 4-foot woven wire or cattle panel fencing (5 feet for agile breeds). Check for gaps regularly, especially at corners and gates. Electric wire along the top and bottom adds extra security.' },
    ],
  },
};
