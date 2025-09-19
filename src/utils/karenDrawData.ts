/**
 * Karen Country Club Stableford Tournament Draw Data
 * The Nancy Millar Trophy 2025 - Sponsored by Commercial Bank of Africa
 */

export interface DrawPairing {
  player1: string;
  player2: string;
  time: string;
  tee: 'FIRST TEE' | 'TENTH TEE';
}

export interface DrawRound {
  roundNumber: number;
  name: string;
  date: string;
  pairings: DrawPairing[];
}

export const KAREN_DRAW_DATA: DrawRound[] = [
  {
    roundNumber: 1,
    name: 'ROUND 1 - SATURDAY AM',
    date: '2025-02-15',
    pairings: [
      // FIRST TEE
      { player1: 'Eve Mwangi', player2: 'Rehema Mohamed', time: '7:00', tee: 'FIRST TEE' },
      { player1: 'Christine Ng\'ang\'a', player2: 'Rose Catherine', time: '7:00', tee: 'FIRST TEE' },
      { player1: 'Ruth Foulser', player2: 'Mercy Nyanchama', time: '7:08', tee: 'FIRST TEE' },
      { player1: 'Mary Wainaina', player2: 'Nyambura Gitimu', time: '7:08', tee: 'FIRST TEE' },
      { player1: 'Kate Ngotho', player2: 'Kate Murima', time: '7:16', tee: 'FIRST TEE' },
      { player1: 'Jinnel Mwangi', player2: 'Christine Mathenge', time: '7:16', tee: 'FIRST TEE' },
      { player1: 'Nelly Njaga', player2: 'Milcah Kamere', time: '7:24', tee: 'FIRST TEE' },
      { player1: 'Rebecca Juma', player2: 'Evelyn Otsyula', time: '7:24', tee: 'FIRST TEE' },
      { player1: 'Monicah Kipchumba Lohwasser', player2: 'Sheila Change', time: '7:32', tee: 'FIRST TEE' },
      { player1: 'Patricia Ithau', player2: 'Irene Kinyanjui', time: '7:32', tee: 'FIRST TEE' },
      { player1: 'Nkatha Nkiiiri', player2: 'Miriam Njoroge', time: '7:40', tee: 'FIRST TEE' },
      { player1: 'Cathy Kimathi', player2: 'Vicky Karuga', time: '7:40', tee: 'FIRST TEE' },
      { player1: 'Susan Kasinga', player2: 'Joyce Wafula', time: '7:48', tee: 'FIRST TEE' },
      { player1: 'Rose Mambo', player2: 'Naomi Njeri Kariuki', time: '7:48', tee: 'FIRST TEE' },
      { player1: 'Jane Wokabi', player2: 'Catherine Mcilwayne', time: '7:56', tee: 'FIRST TEE' },
      { player1: 'Pettie Ndolo', player2: 'Nancy Ikinu', time: '7:56', tee: 'FIRST TEE' },
      { player1: 'Michele Kanaiya', player2: 'Patricia Ngina', time: '8:04', tee: 'FIRST TEE' },
      { player1: 'Emma Pennington', player2: 'Tiffany Algar', time: '8:04', tee: 'FIRST TEE' },
      { player1: 'Elizabeth Armitage', player2: 'Caroline Muthoni', time: '8:12', tee: 'FIRST TEE' },
      { player1: 'Wairimu Maina', player2: 'Wayua Mululu', time: '8:12', tee: 'FIRST TEE' },
      { player1: 'Elizabeth Sargeant', player2: 'Wairimu Gakuo', time: '8:20', tee: 'FIRST TEE' },
      { player1: 'Atsango Lwande', player2: 'Paulynne Kabuga', time: '8:20', tee: 'FIRST TEE' },
      { player1: 'Kagure Mbugua', player2: 'Betty Radier', time: '8:28', tee: 'FIRST TEE' },
      { player1: 'Lucy Gakinya', player2: 'Jennifer Murungi', time: '8:28', tee: 'FIRST TEE' },
      { player1: 'Susan Kihato', player2: 'Lydia Nyambeki', time: '8:36', tee: 'FIRST TEE' },
      { player1: 'Minnie Waithera', player2: 'Nelly Chemoiwa', time: '8:36', tee: 'FIRST TEE' },
      { player1: 'Hellen Chepkwony', player2: 'Ida Makoni', time: '8:44', tee: 'FIRST TEE' },
      { player1: 'Everline Njogu', player2: 'Kathure Njoroge', time: '8:44', tee: 'FIRST TEE' },
      { player1: 'Martha Vincent', player2: 'Mumbi Ngengi', time: '8:52', tee: 'FIRST TEE' },
      { player1: 'Muthoni Muturi', player2: 'Grace Gichuki', time: '8:52', tee: 'FIRST TEE' },
      { player1: 'Margaret Njoki', player2: 'Joyce Njuguini', time: '9:00', tee: 'FIRST TEE' },
      { player1: 'Jacintah Wambugu', player2: 'Betty Gacheru', time: '9:00', tee: 'FIRST TEE' },
      { player1: 'Rachel Koigi', player2: 'Joyce van Tongeren', time: '9:08', tee: 'FIRST TEE' },
      { player1: 'Njeri Onyango', player2: 'Rosemary Kioni', time: '9:08', tee: 'FIRST TEE' },
      { player1: 'Felistus Mutinda', player2: 'Virginia Munyao', time: '9:16', tee: 'FIRST TEE' },

      // TENTH TEE
      { player1: 'Nas Kiengo', player2: 'Nellie Ayodo', time: '7:00', tee: 'TENTH TEE' },
      { player1: 'Caroline Kadikinyi', player2: 'Lydia Mokaya', time: '7:00', tee: 'TENTH TEE' },
      { player1: 'Eunice Koome', player2: 'Sophie Njenga', time: '7:08', tee: 'TENTH TEE' },
      { player1: 'Rhoda Mwebesa', player2: 'Nduku Musyimi', time: '7:08', tee: 'TENTH TEE' },
      { player1: 'Jennifer Cege', player2: 'JaneAlice Mutuota', time: '7:16', tee: 'TENTH TEE' },
      { player1: 'Violet Luchendo', player2: 'Winnie Njeri', time: '7:16', tee: 'TENTH TEE' },
      { player1: 'Rosemary Mkok', player2: 'Annemarie Vellekoop', time: '7:24', tee: 'TENTH TEE' },
      { player1: 'Beatrice Ochola', player2: 'Susan Omondi', time: '7:24', tee: 'TENTH TEE' },
      { player1: 'Dorcas Mbalanya', player2: 'Fiona Manning', time: '7:32', tee: 'TENTH TEE' },
      { player1: 'Veronica Obunga', player2: 'Rose Detho', time: '7:32', tee: 'TENTH TEE' },
      { player1: 'Muthoni Kioi', player2: 'Nkini Pasha', time: '7:40', tee: 'TENTH TEE' },
      { player1: 'Rina Hanrahan', player2: 'Wendy Turmel', time: '7:40', tee: 'TENTH TEE' },
      { player1: 'Wanjiku Mathu', player2: 'Marya Nyambura', time: '7:48', tee: 'TENTH TEE' },
      { player1: 'Atty Harrison', player2: 'Shirley Scrogie', time: '7:48', tee: 'TENTH TEE' },
      { player1: 'Nancy Steinmann', player2: 'Jean Kimani', time: '7:56', tee: 'TENTH TEE' },
      { player1: 'Faith Gathungu', player2: 'Phyllis Mwaura', time: '7:56', tee: 'TENTH TEE' },
      { player1: 'Agnes Muchemi', player2: 'Njeri Gitau', time: '8:04', tee: 'TENTH TEE' },
      { player1: 'Jessica Atego', player2: 'Ida Njogu', time: '8:04', tee: 'TENTH TEE' },
      { player1: 'Sajni Shah', player2: 'Sonal Chandaria', time: '8:12', tee: 'TENTH TEE' },
      { player1: 'Ashley Muyela', player2: 'Royalle Karanja', time: '8:12', tee: 'TENTH TEE' },
      { player1: 'Meera Mandaliya', player2: 'Yusra Butt', time: '8:20', tee: 'TENTH TEE' },
      { player1: 'Zari Njogu', player2: 'Amelia Sheikh', time: '8:20', tee: 'TENTH TEE' },
      { player1: 'Benta Khanili', player2: 'Veronica Muthiani', time: '8:28', tee: 'TENTH TEE' },
      { player1: 'Siphra Nyongesa', player2: 'Mary Awinja', time: '8:28', tee: 'TENTH TEE' },
      { player1: 'Rebecca Njui', player2: 'Judy Nyambura', time: '8:36', tee: 'TENTH TEE' },
      { player1: 'Nirmla Devi', player2: 'Audrey Khaleji', time: '8:36', tee: 'TENTH TEE' },
      { player1: 'Lydiah Maina', player2: 'Caroline Kiengo', time: '8:44', tee: 'TENTH TEE' },
      { player1: 'Wanjiku Guchu', player2: 'Jane Wambui', time: '8:44', tee: 'TENTH TEE' },
      { player1: 'Agnes Wairimu', player2: 'Joyce Ngwiri', time: '8:52', tee: 'TENTH TEE' },
      { player1: 'Joyce Mukua', player2: 'Sophie Njuguna', time: '8:52', tee: 'TENTH TEE' },
      { player1: 'Asenath Mogaka', player2: 'Amani Njogu', time: '9:00', tee: 'TENTH TEE' },
      { player1: 'Rosemary Njogu', player2: 'Elizabeth Kimkung', time: '9:00', tee: 'TENTH TEE' },
      { player1: 'Sylvia Mwai', player2: 'Scola Onsongo', time: '9:08', tee: 'TENTH TEE' },
      { player1: 'Pascalia Koske', player2: 'Njeri Korir', time: '9:08', tee: 'TENTH TEE' },
      { player1: 'Irene Kimeu', player2: 'Ivy Kitee', time: '9:16', tee: 'TENTH TEE' },
    ]
  },
  {
    roundNumber: 2,
    name: 'ROUND 2 - SATURDAY PM',
    date: '2025-02-15',
    pairings: [
      // FIRST TEE
      { player1: 'Rachel Koigi', player2: 'Nas Kiengo', time: '12:00', tee: 'FIRST TEE' },
      { player1: 'Rhoda Mwebesa', player2: 'Violet Luchendo', time: '12:00', tee: 'FIRST TEE' },
      { player1: 'Joyce van Tongeren', player2: 'Nellie Ayodo', time: '12:08', tee: 'FIRST TEE' },
      { player1: 'Nduku Musyimi', player2: 'Winnie Njeri', time: '12:08', tee: 'FIRST TEE' },
      { player1: 'Eunice Koome', player2: 'Jennifer Cege', time: '12:16', tee: 'FIRST TEE' },
      { player1: 'Beatrice Ochola', player2: 'Veronica Obunga', time: '12:16', tee: 'FIRST TEE' },
      { player1: 'Sophie Njenga', player2: 'JaneAlice Mutuota', time: '12:24', tee: 'FIRST TEE' },
      { player1: 'Susan Omondi', player2: 'Rose Detho', time: '12:24', tee: 'FIRST TEE' },
      { player1: 'Rosemary Mkok', player2: 'Dorcas Mbalanya', time: '12:32', tee: 'FIRST TEE' },
      { player1: 'Rina Hanrahan', player2: 'Atty Harrison', time: '12:32', tee: 'FIRST TEE' },
      { player1: 'Annemarie Vellekoop', player2: 'Fiona Manning', time: '12:40', tee: 'FIRST TEE' },
      { player1: 'Wendy Turmel', player2: 'Shirley Scrogie', time: '12:40', tee: 'FIRST TEE' },
      { player1: 'Muthoni Kioi', player2: 'Wanjiku Mathu', time: '12:48', tee: 'FIRST TEE' },
      { player1: 'Njeri Onyango', player2: 'Caroline Kadikinyi', time: '12:48', tee: 'FIRST TEE' },
      { player1: 'Nkini Pasha', player2: 'Marya Nyambura', time: '12:56', tee: 'FIRST TEE' },
      { player1: 'Rosemary Kioni', player2: 'Lydia Mokaya', time: '12:56', tee: 'FIRST TEE' },
      { player1: 'Nancy Steinmann', player2: 'Agnes Muchemi', time: '13:04', tee: 'FIRST TEE' },
      { player1: 'Ashley Muyela', player2: 'Zari Njogu', time: '13:04', tee: 'FIRST TEE' },
      { player1: 'Jean Kimani', player2: 'Njeri Gitau', time: '13:12', tee: 'FIRST TEE' },
      { player1: 'Royalle Karanja', player2: 'Amelia Sheikh', time: '13:12', tee: 'FIRST TEE' },
      { player1: 'Sajni Shah', player2: 'Meera Mandaliya', time: '13:20', tee: 'FIRST TEE' },
      { player1: 'Siphra Nyongesa', player2: 'Nirmla Devi', time: '13:20', tee: 'FIRST TEE' },
      { player1: 'Sonal Chandaria', player2: 'Yusra Butt', time: '13:28', tee: 'FIRST TEE' },
      { player1: 'Mary Awinja', player2: 'Audrey Khaleji', time: '13:28', tee: 'FIRST TEE' },
      { player1: 'Benta Khanili', player2: 'Rebecca Njui', time: '13:36', tee: 'FIRST TEE' },
      { player1: 'Wanjiku Guchu', player2: 'Joyce Mukua', time: '13:36', tee: 'FIRST TEE' },
      { player1: 'Veronica Muthiani', player2: 'Judy Nyambura', time: '13:44', tee: 'FIRST TEE' },
      { player1: 'Jane Wambui', player2: 'Sophie Njuguna', time: '13:44', tee: 'FIRST TEE' },
      { player1: 'Lydiah Maina', player2: 'Agnes Wairimu', time: '13:52', tee: 'FIRST TEE' },
      { player1: 'Faith Gathungu', player2: 'Jessica Atego', time: '13:52', tee: 'FIRST TEE' },
      { player1: 'Caroline Kiengo', player2: 'Joyce Ngwiri', time: '14:00', tee: 'FIRST TEE' },
      { player1: 'Phyllis Mwaura', player2: 'Ida Njogu', time: '14:00', tee: 'FIRST TEE' },
      { player1: 'Asenath Mogaka', player2: 'Sylvia Mwai', time: '14:08', tee: 'FIRST TEE' },
      { player1: 'Rosemary Njogu', player2: 'Pascalia Koske', time: '14:08', tee: 'FIRST TEE' },
      { player1: 'Virginia Munyao', player2: 'Ivy Kitee', time: '14:16', tee: 'FIRST TEE' },

      // TENTH TEE
      { player1: 'Amani Njogu', player2: 'Scola Onsongo', time: '12:00', tee: 'TENTH TEE' },
      { player1: 'Elizabeth Kimkung', player2: 'Njeri Korir', time: '12:00', tee: 'TENTH TEE' },
      { player1: 'Eve Mwangi', player2: 'Ruth Foulser', time: '12:08', tee: 'TENTH TEE' },
      { player1: 'Jinnel Mwangi', player2: 'Rebecca Juma', time: '12:08', tee: 'TENTH TEE' },
      { player1: 'Rehema Mohamed', player2: 'Mercy Nyanchama', time: '12:16', tee: 'FIRST TEE' },
      { player1: 'Christine Mathenge', player2: 'Evelyn Otsyula', time: '12:16', tee: 'TENTH TEE' },
      { player1: 'Kate Ngotho', player2: 'Nelly Njaga', time: '12:24', tee: 'TENTH TEE' },
      { player1: 'Patricia Ithau', player2: 'Cathy Kimathi', time: '12:24', tee: 'TENTH TEE' },
      { player1: 'Kate Murima', player2: 'Milcah Kamere', time: '12:32', tee: 'TENTH TEE' },
      { player1: 'Irene Kinyanjui', player2: 'Vicky Karuga', time: '12:32', tee: 'TENTH TEE' },
      { player1: 'Monicah Kipchumba Lohwasser', player2: 'Nkatha Nkiiiri', time: '12:40', tee: 'TENTH TEE' },
      { player1: 'Rose Mambo', player2: 'Pettie Ndolo', time: '12:40', tee: 'TENTH TEE' },
      { player1: 'Sheila Change', player2: 'Miriam Njoroge', time: '12:48', tee: 'TENTH TEE' },
      { player1: 'Naomi Njeri Kariuki', player2: 'Nancy Ikinu', time: '12:48', tee: 'TENTH TEE' },
      { player1: 'Susan Kasinga', player2: 'Jane Wokabi', time: '12:56', tee: 'TENTH TEE' },
      { player1: 'Christine Ng\'ang\'a', player2: 'Mary Wainaina', time: '12:56', tee: 'TENTH TEE' },
      { player1: 'Joyce Wafula', player2: 'Catherine Mcilwayne', time: '13:04', tee: 'TENTH TEE' },
      { player1: 'Rose Catherine', player2: 'Nyambura Gitimu', time: '13:04', tee: 'TENTH TEE' },
      { player1: 'Michele Kanaiya', player2: 'Elizabeth Armitage', time: '13:12', tee: 'TENTH TEE' },
      { player1: 'Atsango Lwande', player2: 'Lucy Gakinya', time: '13:12', tee: 'TENTH TEE' },
      { player1: 'Patricia Ngina', player2: 'Caroline Muthoni', time: '13:20', tee: 'TENTH TEE' },
      { player1: 'Paulynne Kabuga', player2: 'Jennifer Murungi', time: '13:20', tee: 'TENTH TEE' },
      { player1: 'Elizabeth Sargeant', player2: 'Kagure Mbugua', time: '13:28', tee: 'TENTH TEE' },
      { player1: 'Minnie Waithera', player2: 'Everline Njogu', time: '13:28', tee: 'TENTH TEE' },
      { player1: 'Wairimu Gakuo', player2: 'Betty Radier', time: '13:36', tee: 'TENTH TEE' },
      { player1: 'Nelly Chemoiwa', player2: 'Kathure Njoroge', time: '13:36', tee: 'TENTH TEE' },
      { player1: 'Susan Kihato', player2: 'Hellen Chepkwony', time: '13:44', tee: 'TENTH TEE' },
      { player1: 'Muthoni Muturi', player2: 'Jacintah Wambugu', time: '13:44', tee: 'TENTH TEE' },
      { player1: 'Lydia Nyambeki', player2: 'Ida Makoni', time: '13:52', tee: 'TENTH TEE' },
      { player1: 'Grace Gichuki', player2: 'Betty Gacheru', time: '13:52', tee: 'TENTH TEE' },
      { player1: 'Martha Vincent', player2: 'Margaret Njoki', time: '14:00', tee: 'TENTH TEE' },
      { player1: 'Emma Pennington', player2: 'Wairimu Maina', time: '14:00', tee: 'TENTH TEE' },
      { player1: 'Mumbi Ngengi', player2: 'Joyce Njuguini', time: '14:08', tee: 'TENTH TEE' },
      { player1: 'Tiffany Algar', player2: 'Wayua Mululu', time: '14:08', tee: 'TENTH TEE' },
      { player1: 'Felistus Mutinda', player2: 'Irene Kimeu', time: '14:16', tee: 'TENTH TEE' },
    ]
  },
  {
    roundNumber: 3,
    name: 'ROUND 3 - SUNDAY AM',
    date: '2025-02-16',
    pairings: [
      // FIRST TEE
      { player1: 'Felistus Mutinda', player2: 'Ivy Kitee', time: '7:00', tee: 'FIRST TEE' },
      { player1: 'Asenath Mogaka', player2: 'Scola Onsongo', time: '7:00', tee: 'FIRST TEE' },
      { player1: 'Rosemary Njogu', player2: 'Njeri Korir', time: '7:08', tee: 'FIRST TEE' },
      { player1: 'Amani Njogu', player2: 'Sylvia Mwai', time: '7:08', tee: 'FIRST TEE' },
      { player1: 'Elizabeth Kimkung', player2: 'Pascalia Koske', time: '7:16', tee: 'FIRST TEE' },
      { player1: 'Lydiah Maina', player2: 'Joyce Ngwiri', time: '7:16', tee: 'FIRST TEE' },
      { player1: 'Ashley Muyela', player2: 'Amelia Sheikh', time: '7:24', tee: 'FIRST TEE' },
      { player1: 'Caroline Kiengo', player2: 'Agnes Wairimu', time: '7:24', tee: 'FIRST TEE' },
      { player1: 'Royalle Karanja', player2: 'Zari Njogu', time: '7:32', tee: 'FIRST TEE' },
      { player1: 'Benta Khanili', player2: 'Judy Nyambura', time: '7:32', tee: 'FIRST TEE' },
      { player1: 'Faith Gathungu', player2: 'Ida Njogu', time: '7:40', tee: 'FIRST TEE' },
      { player1: 'Veronica Muthiani', player2: 'Rebecca Njui', time: '7:40', tee: 'FIRST TEE' },
      { player1: 'Phyllis Mwaura', player2: 'Jessica Atego', time: '7:48', tee: 'FIRST TEE' },
      { player1: 'Sajni Shah', player2: 'Yusra Butt', time: '7:48', tee: 'FIRST TEE' },
      { player1: 'Wanjiku Guchu', player2: 'Sophie Njuguna', time: '7:56', tee: 'FIRST TEE' },
      { player1: 'Sonal Chandaria', player2: 'Meera Mandaliya', time: '7:56', tee: 'FIRST TEE' },
      { player1: 'Jane Wambui', player2: 'Joyce Mukua', time: '8:04', tee: 'FIRST TEE' },
      { player1: 'Nancy Steinmann', player2: 'Njeri Gitau', time: '8:04', tee: 'FIRST TEE' },
      { player1: 'Siphra Nyongesa', player2: 'Audrey Khaleji', time: '8:12', tee: 'FIRST TEE' },
      { player1: 'Jean Kimani', player2: 'Agnes Muchemi', time: '8:12', tee: 'FIRST TEE' },
      { player1: 'Mary Awinja', player2: 'Nirmla Devi', time: '8:20', tee: 'FIRST TEE' },
      { player1: 'Muthoni Kioi', player2: 'Marya Nyambura', time: '8:20', tee: 'FIRST TEE' },
      { player1: 'Rhoda Mwebesa', player2: 'Winnie Njeri', time: '8:28', tee: 'FIRST TEE' },
      { player1: 'Nkini Pasha', player2: 'Wanjiku Mathu', time: '8:28', tee: 'FIRST TEE' },
      { player1: 'Nduku Musyimi', player2: 'Violet Luchendo', time: '8:36', tee: 'FIRST TEE' },
      { player1: 'Rosemary Mkok', player2: 'Fiona Manning', time: '8:36', tee: 'FIRST TEE' },
      { player1: 'Njeri Onyango', player2: 'Lydia Mokaya', time: '8:44', tee: 'FIRST TEE' },
      { player1: 'Annemarie Vellekoop', player2: 'Dorcas Mbalanya', time: '8:44', tee: 'FIRST TEE' },
      { player1: 'Rosemary Kioni', player2: 'Caroline Kadikinyi', time: '8:52', tee: 'FIRST TEE' },
      { player1: 'Eunice Koome', player2: 'JaneAlice Mutuota', time: '8:52', tee: 'FIRST TEE' },
      { player1: 'Rina Hanrahan', player2: 'Shirley Scrogie', time: '9:00', tee: 'FIRST TEE' },
      { player1: 'Sophie Njenga', player2: 'Jennifer Cege', time: '9:00', tee: 'FIRST TEE' },
      { player1: 'Wendy Turmel', player2: 'Atty Harrison', time: '9:08', tee: 'FIRST TEE' },
      { player1: 'Rachel Koigi', player2: 'Nellie Ayodo', time: '9:08', tee: 'FIRST TEE' },
      { player1: 'Beatrice Ochola', player2: 'Rose Detho', time: '9:16', tee: 'FIRST TEE' },

      // TENTH TEE
      { player1: 'Virginia Munyao', player2: 'Irene Kimeu', time: '7:00', tee: 'TENTH TEE' },
      { player1: 'Joyce van Tongeren', player2: 'Nas Kiengo', time: '7:08', tee: 'TENTH TEE' },
      { player1: 'Susan Omondi', player2: 'Veronica Obunga', time: '7:08', tee: 'TENTH TEE' },
      { player1: 'Martha Vincent', player2: 'Joyce Njuguini', time: '7:16', tee: 'TENTH TEE' },
      { player1: 'Atsango Lwande', player2: 'Jennifer Murungi', time: '7:16', tee: 'TENTH TEE' },
      { player1: 'Lydiah Maina', player2: 'Joyce Ngwiri', time: '7:24', tee: 'TENTH TEE' },
      { player1: 'Mumbi Ngengi', player2: 'Margaret Njoki', time: '7:24', tee: 'TENTH TEE' },
      { player1: 'Susan Kihato', player2: 'Ida Makoni', time: '7:32', tee: 'TENTH TEE' },
      { player1: 'Emma Pennington', player2: 'Wayua Mululu', time: '7:32', tee: 'TENTH TEE' },
      { player1: 'Lydia Nyambeki', player2: 'Hellen Chepkwony', time: '7:40', tee: 'TENTH TEE' },
      { player1: 'Tiffany Algar', player2: 'Wairimu Maina', time: '7:40', tee: 'TENTH TEE' },
      { player1: 'Elizabeth Sargeant', player2: 'Betty Radier', time: '7:48', tee: 'TENTH TEE' },
      { player1: 'Muthoni Muturi', player2: 'Betty Gacheru', time: '7:48', tee: 'TENTH TEE' },
      { player1: 'Wairimu Gakuo', player2: 'Kagure Mbugua', time: '7:56', tee: 'TENTH TEE' },
      { player1: 'Grace Gichuki', player2: 'Jacintah Wambugu', time: '7:56', tee: 'TENTH TEE' },
      { player1: 'Michele Kanaiya', player2: 'Caroline Muthoni', time: '8:04', tee: 'TENTH TEE' },
      { player1: 'Minnie Waithera', player2: 'Kathure Njoroge', time: '8:04', tee: 'TENTH TEE' },
      { player1: 'Patricia Ngina', player2: 'Elizabeth Armitage', time: '8:12', tee: 'TENTH TEE' },
      { player1: 'Nelly Chemoiwa', player2: 'Everline Njogu', time: '8:12', tee: 'TENTH TEE' },
      { player1: 'Susan Kasinga', player2: 'Catherine Mcilwayne', time: '8:20', tee: 'TENTH TEE' },
      { player1: 'Jinnel Mwangi', player2: 'Evelyn Otsyula', time: '8:20', tee: 'TENTH TEE' },
      { player1: 'Joyce Wafula', player2: 'Jane Wokabi', time: '8:28', tee: 'TENTH TEE' },
      { player1: 'Christine Mathenge', player2: 'Rebecca Juma', time: '8:28', tee: 'TENTH TEE' },
      { player1: 'Monicah Kipchumba Lohwasser', player2: 'Miriam Njoroge', time: '8:36', tee: 'TENTH TEE' },
      { player1: 'Christine Ng\'ang\'a', player2: 'Nyambura Gitimu', time: '8:36', tee: 'TENTH TEE' },
      { player1: 'Sheila Change', player2: 'Nkatha Nkiiiri', time: '8:44', tee: 'TENTH TEE' },
      { player1: 'Rose Catherine', player2: 'Mary Wainaina', time: '8:44', tee: 'TENTH TEE' },
      { player1: 'Kate Ngotho', player2: 'Milcah Kamere', time: '8:52', tee: 'TENTH TEE' },
      { player1: 'Rose Mambo', player2: 'Nancy Ikinu', time: '8:52', tee: 'TENTH TEE' },
      { player1: 'Kate Murima', player2: 'Nelly Njaga', time: '9:00', tee: 'TENTH TEE' },
      { player1: 'Naomi Njeri Kariuki', player2: 'Pettie Ndolo', time: '9:00', tee: 'TENTH TEE' },
      { player1: 'Eve Mwangi', player2: 'Mercy Nyanchama', time: '9:08', tee: 'TENTH TEE' },
      { player1: 'Patricia Ithau', player2: 'Vicky Karuga', time: '9:08', tee: 'TENTH TEE' },
      { player1: 'Rehema Mohamed', player2: 'Ruth Foulser', time: '9:16', tee: 'TENTH TEE' },
      { player1: 'Irene Kinyanjui', player2: 'Cathy Kimathi', time: '9:16', tee: 'TENTH TEE' },
    ]
  }
];

/**
 * Get draw data for a specific round
 */
export function getDrawForRound(roundNumber: number): DrawRound | undefined {
  return KAREN_DRAW_DATA.find(round => round.roundNumber === roundNumber);
}

/**
 * Get all pairings for a specific tee and round
 */
export function getPairingsForTee(roundNumber: number, tee: 'FIRST TEE' | 'TENTH TEE'): DrawPairing[] {
  const round = getDrawForRound(roundNumber);
  if (!round) return [];
  
  return round.pairings.filter(pairing => pairing.tee === tee);
}

/**
 * Find a player's pairing for a specific round
 */
export function findPlayerPairing(playerName: string, roundNumber: number): DrawPairing | undefined {
  const round = getDrawForRound(roundNumber);
  if (!round) return undefined;
  
  return round.pairings.find(pairing => 
    pairing.player1 === playerName || pairing.player2 === playerName
  );
}

/**
 * Get all rounds
 */
export function getAllRounds(): DrawRound[] {
  return KAREN_DRAW_DATA;
}
