/**
 * ProfilePicture Komponent
 * 
 * Denne komponent håndterer upload og visning af brugerens profilbillede.
 * Den integrerer med Supabase Storage til fil-håndtering og opdaterer
 * brugerens profil i databasen efter succesfuld upload.
 * 
 * Funktionalitet:
 * - Viser brugerens nuværende profilbillede eller standard-avatar
 * - Tillader upload af nye billeder via fil-input
 * - Validerer og uploader filer til Supabase Storage
 * - Opdaterer profil-databasen med ny avatar URL
 * - Håndterer fejl og viser bruger-feedback
 * 
 * Supabase Integration:
 * - Storage bucket: 'avatar'
 * - Filsti: `${user.id}/${timestamp}-${filename}`
 * - Profil tabel: 'profiles' med kolonne 'avatar_url'
 */

"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';

const ProfilePicture = () => {
    // Henter brugerdata og profil fra AuthContext
    const { user, profile } = useAuth();
    
    // Oversættelses-funktionalitet til fejlbeskeder
    const { t } = useTranslation();
    
    // State til at vise loading-tilstand under upload
    const [isUploading, setUploading] = useState(false);

    // Standard avatar URL hvis brugeren ikke har uploadet et billede
    const defaultAvatarUrl = 'https://vmyzbnqvfwwmhoazveei.supabase.co/storage/v1/object/public/avatar/default/avatar.svg';

    /**
     * Håndterer fil-upload når brugeren vælger et nyt billede
     * 
     * @param event - React change event fra fil-input elementet
     * 
     * Proces:
     * 1. Validerer at fil og bruger eksisterer
     * 2. Sætter loading state
     * 3. Genererer unikt filnavn med bruger-ID og timestamp
     * 4. Uploader fil til Supabase Storage (med upsert=true for at overskrive)
     * 5. Henter public URL for den uploadede fil
     * 6. Opdaterer brugerens profil med ny avatar_url
     * 7. Genindlæser siden for at vise det nye billede
     * 8. Håndterer fejl og viser brugervenlige beskeder
     */
    async function handleFileChange(event:React.ChangeEvent<HTMLInputElement>) {
        // Hent den valgte fil fra input elementet
        const file = event.target.files?.[0];
        
        // Valider at både fil og bruger eksisterer før upload
        if (!file || !user) return;

        // Aktiver loading state for at vise bruger-feedback
        setUploading(true);
        
        try {
        // Generer unikt filnavn: bruger-ID/timestamp-originalt-filnavn
        // Dette sikrer ingen filnavns-konflikter mellem brugere
        const fileName = `${user.id}/${Date.now()}-${file.name}`;

        // Upload filen til Supabase Storage bucket 'avatar'
        // upsert: true tillader overskrivning af eksisterende filer
        const { error: uploadError } = await supabase.storage
            .from('avatar')
            .upload(fileName, file, {upsert: true});

        // Håndter upload fejl
        if (uploadError) {
            console.error(uploadError);
            alert (t("ErrorMsg.notAblePF")); // Vis brugervenlig fejlbesked
            setUploading(false);
            return;
        }

        // Hent den offentlige URL til den uploadede fil
        const { data: urlData } = await supabase.storage
            .from('avatar')
            .getPublicUrl(fileName);

        const newAvatarUrl = urlData?.publicUrl;

        // Opdater brugerens profil i databasen med den nye avatar URL
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ avatar_url: newAvatarUrl })
            .eq('id', user.id);

            // Håndter database opdaterings-fejl
            if (updateError) {
                console.error(updateError);
                alert (t("ErrorMsg.notAbleUpdate"));
                setUploading(false);
                return;
            }

            // Genindlæs siden for at vise det nye profilbillede
            // Dette sikrer AuthContext også opdateres med ny data
            window.location.reload();

        } catch (error) {
            // Fang uventede fejl og vis generel fejlbesked
            console.error(error);
            alert (t("ErrorMsg.SomethingWentWrong"));
            setUploading(false);
            return;
        } finally {
            // Deaktiver loading state uanset resultat
            setUploading(false);}

    }
        
    return (
        <div className="flex flex-col items-center">
      {/* Label fungerer som klikbar container for fil-upload */}
      <label className="cursor-pointer">
        {/* Viser brugerens profilbillede eller standard avatar */}
        <img
          src={profile?.avatar_url || defaultAvatarUrl}
          alt="Profile billede"
          className="w-40 h-40 rounded-full object-cover border border-gray-300 bg-white"
        />

        {/* Skjult file input - aktiveres når brugeren klikker på billedet */}
        {/* accept="image/*" tillader kun billedfiler */}
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </label>

      {/* Viser loading tekst mens filen uploades */}
      {isUploading && (
        <p className="text-sm text-gray-500 mt-2">Uploader...</p>
      )}
    </div>
    );
};

export default ProfilePicture;