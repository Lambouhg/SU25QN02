"use client";

import ProfileCard from '@/components/ui/profilecard';

const TEAM = [
  {
    img: '/logo.png',
    name: 'Alex Nguyen',
    position: 'Founder & CEO',
    bio: 'Building F.AI Interview to help candidates practice effectively with AI.',
    githubUrl: 'https://github.com/',
    twitterUrl: 'https://twitter.com/',
    skills: [
      { name: 'React', iconUrl: '/next.svg' },
      { name: 'Node', iconUrl: '/next.svg' },
      { name: 'AI', iconUrl: '/next.svg' },
    ],
  },
  {
    img: '/logo.png',
    name: 'Linh Tran',
    position: 'Head of AI',
    bio: 'Researching LLM prompts, evaluation and content generation.',
    githubUrl: 'https://github.com/',
    twitterUrl: 'https://twitter.com/',
    skills: [
      { name: 'Python', iconUrl: '/next.svg' },
      { name: 'Azure OpenAI', iconUrl: '/next.svg' },
      { name: 'RAG', iconUrl: '/next.svg' },
    ],
  },
  {
    img: '/logo.png',
    name: 'Quang Le',
    position: 'Product Lead',
    bio: 'Turning user feedback into delightful features and experiences.',
    githubUrl: 'https://github.com/',
    twitterUrl: 'https://twitter.com/',
    skills: [
      { name: 'Product', iconUrl: '/next.svg' },
      { name: 'UX', iconUrl: '/next.svg' },
      { name: 'Analytics', iconUrl: '/next.svg' },
    ],
  },
  {
    img: '/logo.png',
    name: 'Thu Pham',
    position: 'Design Lead',
    bio: 'Designing clean, accessible interfaces for better learning outcomes.',
    githubUrl: 'https://github.com/',
    twitterUrl: 'https://twitter.com/',
    skills: [
      { name: 'Figma', iconUrl: '/next.svg' },
      { name: 'Motion', iconUrl: '/next.svg' },
      { name: 'UI Systems', iconUrl: '/next.svg' },
    ],
  },
];

export default function OurTeamSection() {
  return (
    <section id="ourteams" className="bg-white">
      <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Our Team</h2>
          <p className="mt-3 text-gray-600">People behind F.AI Interview</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {TEAM.map((m) => (
            <ProfileCard
              key={m.name}
              img={m.img}
              name={m.name}
              bio={m.bio}
              skills={m.skills}
              githubUrl={m.githubUrl}
              twitterUrl={m.twitterUrl}
              position={m.position}
            />
          ))}
        </div>
      </div>
    </section>
  );
}


