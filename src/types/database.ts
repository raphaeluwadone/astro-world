export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      articles: {
        Row: {
          body: string
          cover_image_url: string | null
          created_at: string
          id: string
          kicker: string | null
          published_at: string | null
          title: string
        }
        Insert: {
          body: string
          cover_image_url?: string | null
          created_at?: string
          id?: string
          kicker?: string | null
          published_at?: string | null
          title: string
        }
        Update: {
          body?: string
          cover_image_url?: string | null
          created_at?: string
          id?: string
          kicker?: string | null
          published_at?: string | null
          title?: string
        }
        Relationships: []
      }
      availability: {
        Row: {
          matchday_id: string
          player_id: string
          responded_at: string
          status: Database["public"]["Enums"]["availability_status"]
        }
        Insert: {
          matchday_id: string
          player_id: string
          responded_at?: string
          status: Database["public"]["Enums"]["availability_status"]
        }
        Update: {
          matchday_id?: string
          player_id?: string
          responded_at?: string
          status?: Database["public"]["Enums"]["availability_status"]
        }
        Relationships: [
          {
            foreignKeyName: "availability_matchday_id_fkey"
            columns: ["matchday_id"]
            isOneToOne: false
            referencedRelation: "matchdays"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      comparison_votes: {
        Row: {
          comparison_id: string
          created_at: string
          direction: Database["public"]["Enums"]["vote_direction"]
          updated_at: string
          voter_id: string
        }
        Insert: {
          comparison_id: string
          created_at?: string
          direction: Database["public"]["Enums"]["vote_direction"]
          updated_at?: string
          voter_id: string
        }
        Update: {
          comparison_id?: string
          created_at?: string
          direction?: Database["public"]["Enums"]["vote_direction"]
          updated_at?: string
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comparison_votes_comparison_id_fkey"
            columns: ["comparison_id"]
            isOneToOne: false
            referencedRelation: "player_comparisons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comparison_votes_voter_id_fkey"
            columns: ["voter_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      cup_entrants: {
        Row: {
          created_at: string
          cup_quarter_id: string
          id: string
          player_id: string
        }
        Insert: {
          created_at?: string
          cup_quarter_id: string
          id?: string
          player_id: string
        }
        Update: {
          created_at?: string
          cup_quarter_id?: string
          id?: string
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cup_entrants_cup_quarter_id_fkey"
            columns: ["cup_quarter_id"]
            isOneToOne: false
            referencedRelation: "cup_quarters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cup_entrants_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      cup_matches: {
        Row: {
          created_at: string
          cup_quarter_id: string
          id: string
          played_at: string | null
          score_a: number | null
          score_b: number | null
          squad_a_id: string
          squad_b_id: string
        }
        Insert: {
          created_at?: string
          cup_quarter_id: string
          id?: string
          played_at?: string | null
          score_a?: number | null
          score_b?: number | null
          squad_a_id: string
          squad_b_id: string
        }
        Update: {
          created_at?: string
          cup_quarter_id?: string
          id?: string
          played_at?: string | null
          score_a?: number | null
          score_b?: number | null
          squad_a_id?: string
          squad_b_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cup_matches_cup_quarter_id_fkey"
            columns: ["cup_quarter_id"]
            isOneToOne: false
            referencedRelation: "cup_quarters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cup_matches_squad_a_id_fkey"
            columns: ["squad_a_id"]
            isOneToOne: false
            referencedRelation: "cup_squads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cup_matches_squad_b_id_fkey"
            columns: ["squad_b_id"]
            isOneToOne: false
            referencedRelation: "cup_squads"
            referencedColumns: ["id"]
          },
        ]
      }
      cup_quarters: {
        Row: {
          created_at: string
          entries_close_at: string
          id: string
          label: string
          scheduled_at: string
          status: Database["public"]["Enums"]["cup_status"]
          venue: string | null
          withdrawal_deadline: string
        }
        Insert: {
          created_at?: string
          entries_close_at: string
          id?: string
          label: string
          scheduled_at: string
          status?: Database["public"]["Enums"]["cup_status"]
          venue?: string | null
          withdrawal_deadline: string
        }
        Update: {
          created_at?: string
          entries_close_at?: string
          id?: string
          label?: string
          scheduled_at?: string
          status?: Database["public"]["Enums"]["cup_status"]
          venue?: string | null
          withdrawal_deadline?: string
        }
        Relationships: []
      }
      cup_squad_players: {
        Row: {
          cup_squad_id: string
          player_id: string
        }
        Insert: {
          cup_squad_id: string
          player_id: string
        }
        Update: {
          cup_squad_id?: string
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cup_squad_players_cup_squad_id_fkey"
            columns: ["cup_squad_id"]
            isOneToOne: false
            referencedRelation: "cup_squads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cup_squad_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      cup_squads: {
        Row: {
          colour: string
          cup_quarter_id: string
          id: string
          name: string
        }
        Insert: {
          colour: string
          cup_quarter_id: string
          id?: string
          name: string
        }
        Update: {
          colour?: string
          cup_quarter_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "cup_squads_cup_quarter_id_fkey"
            columns: ["cup_quarter_id"]
            isOneToOne: false
            referencedRelation: "cup_quarters"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          assist_id: string | null
          created_at: string
          id: string
          match_id: string
          minute: number
          scorer_id: string
          team_id: string
        }
        Insert: {
          assist_id?: string | null
          created_at?: string
          id?: string
          match_id: string
          minute: number
          scorer_id: string
          team_id: string
        }
        Update: {
          assist_id?: string | null
          created_at?: string
          id?: string
          match_id?: string
          minute?: number
          scorer_id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_assist_id_fkey"
            columns: ["assist_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_scorer_id_fkey"
            columns: ["scorer_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      match_players: {
        Row: {
          match_id: string
          player_id: string
          team_id: string
        }
        Insert: {
          match_id: string
          player_id: string
          team_id: string
        }
        Update: {
          match_id?: string
          player_id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_players_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      matchday_ballot_entries: {
        Row: {
          created_at: string
          matchday_id: string
          player_id: string
          standby_position: number | null
          status: Database["public"]["Enums"]["ballot_entry_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          matchday_id: string
          player_id: string
          standby_position?: number | null
          status: Database["public"]["Enums"]["ballot_entry_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          matchday_id?: string
          player_id?: string
          standby_position?: number | null
          status?: Database["public"]["Enums"]["ballot_entry_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "matchday_ballot_entries_matchday_id_fkey"
            columns: ["matchday_id"]
            isOneToOne: false
            referencedRelation: "matchdays"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matchday_ballot_entries_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      matchday_motm_votes: {
        Row: {
          created_at: string
          matchday_id: string
          nominee_id: string
          updated_at: string
          voter_id: string
        }
        Insert: {
          created_at?: string
          matchday_id: string
          nominee_id: string
          updated_at?: string
          voter_id: string
        }
        Update: {
          created_at?: string
          matchday_id?: string
          nominee_id?: string
          updated_at?: string
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matchday_motm_votes_matchday_id_fkey"
            columns: ["matchday_id"]
            isOneToOne: false
            referencedRelation: "matchdays"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matchday_motm_votes_nominee_id_fkey"
            columns: ["nominee_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matchday_motm_votes_voter_id_fkey"
            columns: ["voter_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      matchdays: {
        Row: {
          capacity: number
          created_at: string
          id: string
          played_at: string
          status: Database["public"]["Enums"]["matchday_status"]
          venue: string | null
        }
        Insert: {
          capacity?: number
          created_at?: string
          id?: string
          played_at: string
          status?: Database["public"]["Enums"]["matchday_status"]
          venue?: string | null
        }
        Update: {
          capacity?: number
          created_at?: string
          id?: string
          played_at?: string
          status?: Database["public"]["Enums"]["matchday_status"]
          venue?: string | null
        }
        Relationships: []
      }
      matches: {
        Row: {
          id: string
          matchday_id: string
          played_at: string
          score_a: number
          score_b: number
          team_a_id: string
          team_b_id: string
        }
        Insert: {
          id?: string
          matchday_id: string
          played_at?: string
          score_a?: number
          score_b?: number
          team_a_id: string
          team_b_id: string
        }
        Update: {
          id?: string
          matchday_id?: string
          played_at?: string
          score_a?: number
          score_b?: number
          team_a_id?: string
          team_b_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_matchday_id_fkey"
            columns: ["matchday_id"]
            isOneToOne: false
            referencedRelation: "matchdays"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_team_a_id_fkey"
            columns: ["team_a_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_team_b_id_fkey"
            columns: ["team_b_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_awards: {
        Row: {
          award_key: string
          award_name: string
          confirmed: boolean
          created_at: string
          id: string
          metric: string
          month: number
          player_id: string | null
          stat: string
          winner_nickname: string
          year: number
        }
        Insert: {
          award_key: string
          award_name: string
          confirmed?: boolean
          created_at?: string
          id?: string
          metric: string
          month: number
          player_id?: string | null
          stat: string
          winner_nickname: string
          year: number
        }
        Update: {
          award_key?: string
          award_name?: string
          confirmed?: boolean
          created_at?: string
          id?: string
          metric?: string
          month?: number
          player_id?: string | null
          stat?: string
          winner_nickname?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "monthly_awards_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_memberships: {
        Row: {
          claimed_at: string
          id: string
          month: string
          player_id: string
        }
        Insert: {
          claimed_at?: string
          id?: string
          month: string
          player_id: string
        }
        Update: {
          claimed_at?: string
          id?: string
          month?: string
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "monthly_memberships_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_claims: {
        Row: {
          birthday_day: number | null
          birthday_month: number | null
          claimant_user_id: string
          id: string
          instagram_handle: string | null
          player_id: string
          requested_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["player_claim_status"]
        }
        Insert: {
          birthday_day?: number | null
          birthday_month?: number | null
          claimant_user_id: string
          id?: string
          instagram_handle?: string | null
          player_id: string
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["player_claim_status"]
        }
        Update: {
          birthday_day?: number | null
          birthday_month?: number | null
          claimant_user_id?: string
          id?: string
          instagram_handle?: string | null
          player_id?: string
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["player_claim_status"]
        }
        Relationships: [
          {
            foreignKeyName: "player_claims_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_claims_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_comparisons: {
        Row: {
          created_at: string
          created_by: string
          dropped_at: string | null
          id: string
          player_id: string
          pro_player_id: string
          source: Database["public"]["Enums"]["comparison_source"]
        }
        Insert: {
          created_at?: string
          created_by: string
          dropped_at?: string | null
          id?: string
          player_id: string
          pro_player_id: string
          source: Database["public"]["Enums"]["comparison_source"]
        }
        Update: {
          created_at?: string
          created_by?: string
          dropped_at?: string | null
          id?: string
          player_id?: string
          pro_player_id?: string
          source?: Database["public"]["Enums"]["comparison_source"]
        }
        Relationships: [
          {
            foreignKeyName: "player_comparisons_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_comparisons_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_comparisons_pro_player_id_fkey"
            columns: ["pro_player_id"]
            isOneToOne: false
            referencedRelation: "pro_players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_tag_votes: {
        Row: {
          created_at: string
          player_id: string
          tag_id: string
          voter_id: string
        }
        Insert: {
          created_at?: string
          player_id: string
          tag_id: string
          voter_id: string
        }
        Update: {
          created_at?: string
          player_id?: string
          tag_id?: string
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_tag_votes_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_tag_votes_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_tag_votes_voter_id_fkey"
            columns: ["voter_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_tags: {
        Row: {
          created_at: string
          id: string
          player_id: string
          source: Database["public"]["Enums"]["tag_source"]
          tag_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          player_id: string
          source: Database["public"]["Enums"]["tag_source"]
          tag_id: string
        }
        Update: {
          created_at?: string
          id?: string
          player_id?: string
          source?: Database["public"]["Enums"]["tag_source"]
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_tags_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          bio: string | null
          birthday_day: number | null
          birthday_month: number | null
          created_at: string
          favourite_club: string | null
          favourite_club_logo_url: string | null
          favourite_number: number | null
          full_name: string
          height_cm: number | null
          id: string
          instagram_handle: string | null
          is_admin: boolean
          joined_at: string
          legacy_appearances: number
          legacy_assists: number
          legacy_clean_sheets: number
          legacy_goals: number
          legacy_red_cards: number
          legacy_yellow_cards: number
          nickname: string
          onboarded_at: string | null
          photo_url: string | null
          positions: Database["public"]["Enums"]["position_type"][]
          preferred_foot: Database["public"]["Enums"]["foot_type"] | null
          updated_at: string
          user_id: string | null
          weight_kg: number | null
        }
        Insert: {
          bio?: string | null
          birthday_day?: number | null
          birthday_month?: number | null
          created_at?: string
          favourite_club?: string | null
          favourite_club_logo_url?: string | null
          favourite_number?: number | null
          full_name: string
          height_cm?: number | null
          id?: string
          instagram_handle?: string | null
          is_admin?: boolean
          joined_at?: string
          legacy_appearances?: number
          legacy_assists?: number
          legacy_clean_sheets?: number
          legacy_goals?: number
          legacy_red_cards?: number
          legacy_yellow_cards?: number
          nickname: string
          onboarded_at?: string | null
          photo_url?: string | null
          positions?: Database["public"]["Enums"]["position_type"][]
          preferred_foot?: Database["public"]["Enums"]["foot_type"] | null
          updated_at?: string
          user_id?: string | null
          weight_kg?: number | null
        }
        Update: {
          bio?: string | null
          birthday_day?: number | null
          birthday_month?: number | null
          created_at?: string
          favourite_club?: string | null
          favourite_club_logo_url?: string | null
          favourite_number?: number | null
          full_name?: string
          height_cm?: number | null
          id?: string
          instagram_handle?: string | null
          is_admin?: boolean
          joined_at?: string
          legacy_appearances?: number
          legacy_assists?: number
          legacy_clean_sheets?: number
          legacy_goals?: number
          legacy_red_cards?: number
          legacy_yellow_cards?: number
          nickname?: string
          onboarded_at?: string | null
          photo_url?: string | null
          positions?: Database["public"]["Enums"]["position_type"][]
          preferred_foot?: Database["public"]["Enums"]["foot_type"] | null
          updated_at?: string
          user_id?: string | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      post_likes: {
        Row: {
          created_at: string
          player_id: string
          post_id: string
        }
        Insert: {
          created_at?: string
          player_id: string
          post_id: string
        }
        Update: {
          created_at?: string
          player_id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_mentions: {
        Row: {
          mentioned_player_id: string
          post_id: string
        }
        Insert: {
          mentioned_player_id: string
          post_id: string
        }
        Update: {
          mentioned_player_id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_mentions_mentioned_player_id_fkey"
            columns: ["mentioned_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_mentions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      pro_clubs: {
        Row: {
          cached_at: string
          country: string | null
          external_id: string | null
          id: string
          logo_url: string | null
          name: string
        }
        Insert: {
          cached_at?: string
          country?: string | null
          external_id?: string | null
          id?: string
          logo_url?: string | null
          name: string
        }
        Update: {
          cached_at?: string
          country?: string | null
          external_id?: string | null
          id?: string
          logo_url?: string | null
          name?: string
        }
        Relationships: []
      }
      pro_players: {
        Row: {
          apps: number | null
          assists: number | null
          cached_at: string
          external_id: string | null
          goals: number | null
          id: string
          name: string
          nationality: string | null
          photo_url: string | null
          role: string | null
        }
        Insert: {
          apps?: number | null
          assists?: number | null
          cached_at?: string
          external_id?: string | null
          goals?: number | null
          id?: string
          name: string
          nationality?: string | null
          photo_url?: string | null
          role?: string | null
        }
        Update: {
          apps?: number | null
          assists?: number | null
          cached_at?: string
          external_id?: string | null
          goals?: number | null
          id?: string
          name?: string
          nationality?: string | null
          photo_url?: string | null
          role?: string | null
        }
        Relationships: []
      }
      ratings: {
        Row: {
          created_at: string
          match_id: string
          rater_id: string
          score: number
          subject_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          match_id: string
          rater_id: string
          score: number
          subject_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          match_id?: string
          rater_id?: string
          score?: number
          subject_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_rater_id_fkey"
            columns: ["rater_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      tag_creation_votes: {
        Row: {
          created_at: string
          tag_id: string
          voter_id: string
        }
        Insert: {
          created_at?: string
          tag_id: string
          voter_id: string
        }
        Update: {
          created_at?: string
          tag_id?: string
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tag_creation_votes_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tag_creation_votes_voter_id_fkey"
            columns: ["voter_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          approved_at: string | null
          created_at: string
          created_by: string
          id: string
          is_approved: boolean
          label: string
        }
        Insert: {
          approved_at?: string | null
          created_at?: string
          created_by: string
          id?: string
          is_approved?: boolean
          label: string
        }
        Update: {
          approved_at?: string | null
          created_at?: string
          created_by?: string
          id?: string
          is_approved?: boolean
          label?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          player_id: string
          team_id: string
        }
        Insert: {
          player_id: string
          team_id: string
        }
        Update: {
          player_id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          colour: string
          greek_name: string
          id: string
          matchday_id: string
        }
        Insert: {
          colour: string
          greek_name: string
          id?: string
          matchday_id: string
        }
        Update: {
          colour?: string
          greek_name?: string
          id?: string
          matchday_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_matchday_id_fkey"
            columns: ["matchday_id"]
            isOneToOne: false
            referencedRelation: "matchdays"
            referencedColumns: ["id"]
          },
        ]
      }
      tributes: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tributes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cup_entries_open: { Args: { p_cup_quarter_id: string }; Returns: boolean }
      is_own_player: { Args: { p_player_id: string }; Returns: boolean }
      is_requesting_admin: { Args: never; Returns: boolean }
      match_ratings_integrity: {
        Args: { p_match_id: string }
        Returns: {
          lowest_avg: number
          match_avg: number
          voter_count: number
        }[]
      }
      match_ratings_summary: {
        Args: never
        Returns: {
          avg_rating: number
          match_id: string
          subject_id: string
          vote_count: number
        }[]
      }
      matchday_is_open: { Args: { p_matchday_id: string }; Returns: boolean }
      matchday_motm_summary: {
        Args: never
        Returns: {
          matchday_id: string
          nominee_id: string
          vote_count: number
        }[]
      }
      motm_open_for: { Args: { p_matchday_id: string }; Returns: boolean }
      played_in_match: {
        Args: { p_match_id: string; p_player_id: string }
        Returns: boolean
      }
      played_in_matchday: {
        Args: { p_matchday_id: string; p_player_id: string }
        Returns: boolean
      }
      player_career_stats: {
        Args: never
        Returns: {
          appearances: number
          assists: number
          avg_rating: number
          goals: number
          motm_count: number
          player_id: string
        }[]
      }
      player_match_ratings: {
        Args: { p_player_id: string }
        Returns: {
          avg_rating: number
          match_id: string
          played_at: string
        }[]
      }
      public_roster_size: { Args: never; Returns: number }
      ratings_open_for: { Args: { p_match_id: string }; Returns: boolean }
      season_team_matches: {
        Args: { p_season_start: string }
        Returns: {
          goals_against: number
          goals_for: number
          greek_name: string
          played_at: string
        }[]
      }
      voting_closes_at: { Args: { p_played_at: string }; Returns: string }
    }
    Enums: {
      availability_status: "in" | "out"
      ballot_entry_status: "balloted" | "standby"
      comparison_source: "self" | "community"
      cup_status: "open" | "drawn" | "live" | "played" | "cancelled"
      foot_type: "left" | "right" | "both"
      matchday_status:
        | "open"
        | "balloted"
        | "drawn"
        | "complete"
        | "played"
        | "cancelled"
      player_claim_status: "pending" | "approved" | "rejected"
      position_type: "GK" | "DEF" | "ATT" | "UTIL"
      tag_source: "self" | "community"
      vote_direction: "up" | "down"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      availability_status: ["in", "out"],
      ballot_entry_status: ["balloted", "standby"],
      comparison_source: ["self", "community"],
      cup_status: ["open", "drawn", "live", "played", "cancelled"],
      foot_type: ["left", "right", "both"],
      matchday_status: [
        "open",
        "balloted",
        "drawn",
        "complete",
        "played",
        "cancelled",
      ],
      player_claim_status: ["pending", "approved", "rejected"],
      position_type: ["GK", "DEF", "ATT", "UTIL"],
      tag_source: ["self", "community"],
      vote_direction: ["up", "down"],
    },
  },
} as const

