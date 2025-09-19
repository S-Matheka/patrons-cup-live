'use client';

import React, { useState } from 'react';
import { Calendar, Clock, MapPin } from 'lucide-react';

interface DrawPairing {
  time: string;
  firstTee: string[];
  tenthTee: string[];
}

interface DrawRound {
  roundNumber: number;
  title: string;
  date: string;
  pairings: DrawPairing[];
}

const KarenDrawDisplay: React.FC = () => {
  const [selectedRound, setSelectedRound] = useState<number>(1);
  const [selectedTee, setSelectedTee] = useState<'all' | 'first' | 'tenth'>('all');

  // Nancy Millar Trophy Draw Data - Foursomes Format
  const drawRounds: DrawRound[] = [
    {
      roundNumber: 1,
      title: 'Round 1 - Saturday AM',
      date: 'Saturday, September 20, 2025',
      pairings: [
        {
          time: '7:00',
          firstTee: ['Team 1: A & C', 'Team 2: A & C'],
          tenthTee: ['Team 1: B & D', 'Team 2: B & D']
        },
        {
          time: '7:08',
          firstTee: ['Team 3: A & C', 'Team 4: A & C'],
          tenthTee: ['Team 3: B & D', 'Team 4: B & D']
        },
        {
          time: '7:16',
          firstTee: ['Team 5: A & C', 'Team 6: A & C'],
          tenthTee: ['Team 5: B & D', 'Team 6: B & D']
        },
        {
          time: '7:24',
          firstTee: ['Team 7: A & C', 'Team 8: A & C'],
          tenthTee: ['Team 7: B & D', 'Team 8: B & D']
        },
        {
          time: '7:32',
          firstTee: ['Team 9: A & C', 'Team 10: A & C'],
          tenthTee: ['Team 9: B & D', 'Team 10: B & D']
        },
        {
          time: '7:40',
          firstTee: ['Team 11: A & C', 'Team 12: A & C'],
          tenthTee: ['Team 11: B & D', 'Team 12: B & D']
        },
        {
          time: '7:48',
          firstTee: ['Team 13: A & C', 'Team 14: A & C'],
          tenthTee: ['Team 13: B & D', 'Team 14: B & D']
        },
        {
          time: '7:56',
          firstTee: ['Team 15: A & C', 'Team 16: A & C'],
          tenthTee: ['Team 15: B & D', 'Team 16: B & D']
        }
      ]
    },
    {
      roundNumber: 2,
      title: 'Round 2 - Saturday PM',
      date: 'Saturday, September 20, 2025',
      pairings: [
        {
          time: '12:00',
          firstTee: ['Team 1: A & D', 'Team 2: A & D'],
          tenthTee: ['Team 1: B & C', 'Team 2: B & C']
        },
        {
          time: '12:08',
          firstTee: ['Team 3: A & D', 'Team 4: A & D'],
          tenthTee: ['Team 3: B & C', 'Team 4: B & C']
        },
        {
          time: '12:16',
          firstTee: ['Team 5: A & D', 'Team 6: A & D'],
          tenthTee: ['Team 5: B & C', 'Team 6: B & C']
        },
        {
          time: '12:24',
          firstTee: ['Team 7: A & D', 'Team 8: A & D'],
          tenthTee: ['Team 7: B & C', 'Team 8: B & C']
        },
        {
          time: '12:32',
          firstTee: ['Team 9: A & D', 'Team 10: A & D'],
          tenthTee: ['Team 9: B & C', 'Team 10: B & C']
        },
        {
          time: '12:40',
          firstTee: ['Team 11: A & D', 'Team 12: A & D'],
          tenthTee: ['Team 11: B & C', 'Team 12: B & C']
        },
        {
          time: '12:48',
          firstTee: ['Team 13: A & D', 'Team 14: A & D'],
          tenthTee: ['Team 13: B & C', 'Team 14: B & C']
        },
        {
          time: '12:56',
          firstTee: ['Team 15: A & D', 'Team 16: A & D'],
          tenthTee: ['Team 15: B & C', 'Team 16: B & C']
        }
      ]
    },
    {
      roundNumber: 3,
      title: 'Round 3 - Sunday AM',
      date: 'Sunday, September 21, 2025',
      pairings: [
        {
          time: '7:00',
          firstTee: ['Team 1: A & B', 'Team 2: A & B'],
          tenthTee: ['Team 1: C & D', 'Team 2: C & D']
        },
        {
          time: '7:08',
          firstTee: ['Team 3: A & B', 'Team 4: A & B'],
          tenthTee: ['Team 3: C & D', 'Team 4: C & D']
        },
        {
          time: '7:16',
          firstTee: ['Team 5: A & B', 'Team 6: A & B'],
          tenthTee: ['Team 5: C & D', 'Team 6: C & D']
        },
        {
          time: '7:24',
          firstTee: ['Team 7: A & B', 'Team 8: A & B'],
          tenthTee: ['Team 7: C & D', 'Team 8: C & D']
        },
        {
          time: '7:32',
          firstTee: ['Team 9: A & B', 'Team 10: A & B'],
          tenthTee: ['Team 9: C & D', 'Team 10: C & D']
        },
        {
          time: '7:40',
          firstTee: ['Team 11: A & B', 'Team 12: A & B'],
          tenthTee: ['Team 11: C & D', 'Team 12: C & D']
        },
        {
          time: '7:48',
          firstTee: ['Team 13: A & B', 'Team 14: A & B'],
          tenthTee: ['Team 13: C & D', 'Team 14: C & D']
        },
        {
          time: '7:56',
          firstTee: ['Team 15: A & B', 'Team 16: A & B'],
          tenthTee: ['Team 15: C & D', 'Team 16: C & D']
        }
      ]
    }
  ];

  const currentRound = drawRounds.find(round => round.roundNumber === selectedRound);

  const filteredPairings = currentRound?.pairings.filter(pairing => {
    if (selectedTee === 'all') return true;
    if (selectedTee === 'first') return pairing.firstTee.length > 0;
    if (selectedTee === 'tenth') return pairing.tenthTee.length > 0;
    return true;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Round Selector */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex flex-col gap-4 mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Tournament Draw</h3>
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            {drawRounds.map((round) => (
              <button
                key={round.roundNumber}
                onClick={() => setSelectedRound(round.roundNumber)}
                className={`flex-1 px-3 py-2 text-xs sm:text-sm font-medium transition-colors ${
                  selectedRound === round.roundNumber
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                R{round.roundNumber}
              </button>
            ))}
          </div>
        </div>

        {/* Round Info */}
        <div className="mb-4 sm:mb-6">
          <h4 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">{currentRound?.title}</h4>
          <div className="flex items-center text-gray-600">
            <Calendar className="h-4 w-4 mr-2" />
            <span className="text-xs sm:text-sm">{currentRound?.date}</span>
          </div>
        </div>

        {/* Tee Filter */}
        <div className="mb-4 sm:mb-6">
          <div className="flex rounded-lg border border-gray-300 overflow-hidden w-full sm:w-fit">
            <button
              onClick={() => setSelectedTee('all')}
              className={`flex-1 sm:flex-none px-3 py-2 text-xs sm:text-sm font-medium transition-colors ${
                selectedTee === 'all'
                  ? 'bg-green-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              All Tees
            </button>
            <button
              onClick={() => setSelectedTee('first')}
              className={`flex-1 sm:flex-none px-3 py-2 text-xs sm:text-sm font-medium transition-colors ${
                selectedTee === 'first'
                  ? 'bg-green-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              First Tee
            </button>
            <button
              onClick={() => setSelectedTee('tenth')}
              className={`flex-1 sm:flex-none px-3 py-2 text-xs sm:text-sm font-medium transition-colors ${
                selectedTee === 'tenth'
                  ? 'bg-green-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Tenth Tee
            </button>
          </div>
        </div>
      </div>

      {/* Draw Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Tee Time</span>
                    <span className="sm:hidden">Time</span>
                  </div>
                </th>
                <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">First Tee</span>
                    <span className="sm:hidden">1st</span>
                  </div>
                </th>
                <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Tenth Tee</span>
                    <span className="sm:hidden">10th</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPairings.map((pairing, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <div className="text-xs sm:text-sm font-medium text-gray-900">{pairing.time}</div>
                  </td>
                  <td className="px-2 sm:px-6 py-3 sm:py-4">
                    <div className="space-y-1">
                      {pairing.firstTee.map((player, playerIndex) => (
                        <div key={playerIndex} className="text-xs sm:text-sm text-gray-900 truncate max-w-[120px] sm:max-w-none">
                          {player}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-2 sm:px-6 py-3 sm:py-4">
                    <div className="space-y-1">
                      {pairing.tenthTee.map((player, playerIndex) => (
                        <div key={playerIndex} className="text-xs sm:text-sm text-gray-900 truncate max-w-[120px] sm:max-w-none">
                          {player}
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Draw Summary */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Draw Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{filteredPairings.length}</div>
            <div className="text-sm text-gray-600">Tee Times</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {filteredPairings.reduce((total, pairing) => total + pairing.firstTee.length + pairing.tenthTee.length, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Pairings</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {filteredPairings.reduce((total, pairing) => total + pairing.firstTee.length + pairing.tenthTee.length, 0) * 2}
            </div>
            <div className="text-sm text-gray-600">Players</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KarenDrawDisplay;