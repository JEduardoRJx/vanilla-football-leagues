import { createClient } from 'https://cdn.skypack.dev/@prismicio/client';
import { asHTML } from 'https://cdn.skypack.dev/@prismicio/helpers';

const repositoryName = 'vanilla-leagues';
const client = createClient(repositoryName, {
  routes: [
    {
      type: 'league',
      path: '/league/:uid',
    },
  ],
});

const htmlSerializer = (type, element, content, children) => {
  if (type === 'label' && element.data.label === 'codespan') {
    return `<code>${children}</code>`;
  }
  return null;
};

const renderRichText = (richTextField) =>
  asHTML(richTextField, null, htmlSerializer);

const enablePreviews = async () => {
  const previewCookie = document.cookie.match(
    /(^|;)\s*io.prismic.preview=(.+?)(;|$)/
  );
  if (previewCookie) {
    await client.enableAutoPreviews();
  }
};

const LeagueCard = (league) => {
  const formatDate = (dateString) =>
    new Intl.DateTimeFormat('en-GB').format(new Date(dateString));
  return `
    <div class="card league-card" data-league-id="${
      league.id
    }" data-league-uid="${league.uid}">
      <img src="${league.logo}" alt="${league.name}" class="league-logo" />
      <h2>${league.name}</h2>
      <p>Last Updated: ${formatDate(league.date)}</p>
    </div>
  `;
};

const TeamCard = (team) => {
  const imgUrl = `${team.logo1.url}?duotone=ff0000,0000ff&h=200&w=300`;
  return `
    <div class="card team-card">
      <img class="team-logo" src="${imgUrl}"
        srcset="${team.logo1.url}?h=100&w=150 150w, ${
    team.logo1.url
  }?h=200&w=300 300w"
        alt="${team.name1[0].text}" />
      <h3>${team.name1[0].text}</h3>
      <p>Est. ${team.foundedYear}</p>
      ${renderRichText(team.stadium)}
      <div class="team-colors">
        <div class="color" style="background-color: ${team.mainColor1};"></div>
        <span>${team.mainColor1}</span>
      </div>
      <div class="team-colors">
        <div class="color" style="background-color: ${team.mainColor2};"></div>
        <span>${team.mainColor2}</span>
      </div>
    </div>
  `;
};

const renderLeagues = async () => {
  await enablePreviews();
  const leagues = await client.getAllByType('league');
  let leaguesContainer = document.getElementById('leagues-container');

  if (!leaguesContainer) {
    leaguesContainer = document.createElement('div');
    leaguesContainer.id = 'leagues-container';
    document.body.appendChild(leaguesContainer);
  }

  const leaguesHtml = leagues
    .map((league) => {
      const leagueData = league.data;
      return LeagueCard({
        logo: leagueData.logo.url,
        name: leagueData.name[0].text,
        id: league.id,
        date: league.last_publication_date,
        uid: league.uid,
      });
    })
    .join('');

  leaguesContainer.innerHTML = `
    <h1>Leagues</h1>
    <div class="leagues-container">${leaguesHtml}</div>
  `;

  document.querySelectorAll('.league-card').forEach((card) => {
    card.addEventListener('click', () => {
      const leagueUid = card.getAttribute('data-league-uid');
      window.history.pushState({}, '', `/league/${leagueUid}`);
      renderTeams(card.getAttribute('data-league-id'));
    });
  });
};

const renderTeams = async (leagueId) => {
  const league = await client.getByID(leagueId);
  const teams = league.data.teams;

  let teamsContainer = document.getElementById('teams-container');
  if (!teamsContainer) {
    teamsContainer = document.createElement('div');
    teamsContainer.id = 'teams-container';
    document.body.appendChild(teamsContainer);
  }

  const teamsHtml = teams
    .map((team) => {
      return TeamCard({
        logo1: team.team_logo,
        name1: team.team_name,
        foundedYear: team.founded_year[0].text,
        stadium: team.stadium,
        mainColor1: team.main_color_1[0].text,
        mainColor2: team.main_color_2[0].text,
      });
    })
    .join('');

  teamsContainer.innerHTML = `
    <h1>Teams</h1>
    <div class="teams-container">${teamsHtml}</div>
  `;
};

const init = async () => {
  const hash = window.location.pathname;
  const parts = hash.split('/').filter(Boolean);

  if (parts[0] === 'league' && parts[1]) {
    const leagueUid = parts[1];
    const league = await client.getByUID('league', leagueUid);
    await renderLeagues();
    await renderTeams(league.id);
  } else {
    await renderLeagues();
  }
};

init();
window.addEventListener('popstate', init);
window.addEventListener('load', init);
