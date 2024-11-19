import { createClient } from 'https://cdn.skypack.dev/@prismicio/client';
import { asHTML } from 'https://cdn.skypack.dev/@prismicio/helpers';

const htmlSerializer = (type, element, content, children) => {
  if (type === 'label' && element.data.label === 'codespan') {
    return `<code>${children.join('')}</code>`;
  }
  return null;
};

const renderRichText = (richTextField) => {
  return asHTML(richTextField, null, htmlSerializer);
};

const repositoryName = 'vanilla-leagues';
const client = createClient(repositoryName);

const LeagueCard = (league) => {
  const formatDate = (dateString) => {
    return new Intl.DateTimeFormat('en-GB').format(new Date(dateString));
  };

  const formattedDate = formatDate(league.date);

  return `
    <div class="card league-card" data-league-id="${league.id}">
      <img src="${league.logo}" alt="${league.name}" class="league-logo" />
      <h2>${league.name}</h2>
      <p>Last Updated: ${formattedDate}</p>
    </div>
  `;
};

const TeamCard = (team) => {
  const imgUrl = `${team.logo1.url}?duotone=ff0000,0000ff&h=200&w=300`;

  return `
    <div class="card team-card">
      <img
      class="team-logo"
        src="${imgUrl}"
        srcset="${team.logo1.url}?h=100&w=150 150w,
        ${team.logo1.url}?h=200&w=300 300w" alt="${team.name1[0].text}"
      />
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
  try {
    const leagues = await client.getAllByType('league');
    const leaguesContainer = document.getElementById('leagues-container');

    const leaguesHtml = leagues
      .map((league) => {
        const leagueData = league.data;
        return LeagueCard({
          logo: leagueData.logo.url,
          name: leagueData.name[0].text,
          id: league.id,
          date: league.last_publication_date,
        });
      })
      .join('');

    leaguesContainer.innerHTML = `
      <h1>Leagues</h1>
      <div class="leagues-container">${leaguesHtml}</div>
    `;

    const leagueCards = document.querySelectorAll('.league-card');
    leagueCards.forEach((card) => {
      card.addEventListener('click', () => {
        const leagueId = card.getAttribute('data-league-id');
        renderTeams(leagueId);
      });
    });
  } catch (error) {
    console.error('Error fetching leagues:', error);
  }
};

const renderTeams = async (leagueId) => {
  try {
    const league = await client.getByID(leagueId);
    const teams = league.data.teams;
    const teamsContainer = document.getElementById('teams-container');

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
  } catch (error) {
    console.error('Error fetching teams:', error);
  }
};

const init = async () => {
  await renderLeagues();

  const mainContainer = document.body;
  const teamsContainer = document.createElement('div');
  teamsContainer.id = 'teams-container';
  mainContainer.appendChild(teamsContainer);
};

init();
