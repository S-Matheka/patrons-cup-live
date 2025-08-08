'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { TournamentContextType, Team, Player, Match, Score } from '@/types';
import teamsData from '@/data/teams.json';
import playersData from '@/data/players.json';
import matchesData from '@/data/matches.json';
import scoresData from '@/data/scores.json';

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

export const useTournament = () => {
  const context = useContext(TournamentContext);
  if (context === undefined) {
    throw new Error('useTournament must be used within a TournamentProvider');
  }
  return context;
};

interface TournamentProviderProps {
  children: React.ReactNode;
}

export const TournamentProvider: React.FC<TournamentProviderProps> = ({ children }) => {
  const [teams, setTeams] = useState<Team[]>(teamsData as Team[]);
  const [players, setPlayers] = useState<Player[]>(playersData as Player[]);
  const [matches, setMatches] = useState<Match[]>(matchesData as Match[]);
  const [scores, setScores] = useState<Score[]>(scoresData as Score[]);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedMatches = localStorage.getItem('tournament-matches');
    const savedScores = localStorage.getItem('tournament-scores');
    
    if (savedMatches) {
      setMatches(JSON.parse(savedMatches));
    }
    
    if (savedScores) {
      setScores(JSON.parse(savedScores));
    }
  }, []);

  // Save matches to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('tournament-matches', JSON.stringify(matches));
  }, [matches]);

  // Save scores to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('tournament-scores', JSON.stringify(scores));
  }, [scores]);

  const updateMatch = (matchId: number, updatedMatch: Match) => {
    setMatches(prevMatches => 
      prevMatches.map(match => 
        match.id === matchId ? updatedMatch : match
      )
    );
  };

  const updateScore = (teamId: number, updatedScore: Score) => {
    setScores(prevScores => 
      prevScores.map(score => 
        score.teamId === teamId ? updatedScore : score
      )
    );
  };

  const getTeamById = (id: number): Team | undefined => {
    return teams.find(team => team.id === id);
  };

  const getPlayersByTeamId = (teamId: number): Player[] => {
    return players.filter(player => player.teamId === teamId);
  };

  const getMatchById = (id: number): Match | undefined => {
    return matches.find(match => match.id === id);
  };

  const getScoreByTeamId = (teamId: number): Score | undefined => {
    return scores.find(score => score.teamId === teamId);
  };

  const value: TournamentContextType = {
    teams,
    players,
    matches,
    scores,
    updateMatch,
    updateScore,
    getTeamById,
    getPlayersByTeamId,
    getMatchById,
    getScoreByTeamId,
  };

  return (
    <TournamentContext.Provider value={value}>
      {children}
    </TournamentContext.Provider>
  );
}; 