"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';

const ProfilePicture = () => {
    const { user, profile } = useAuth();
    const { t } = useTranslation();
    const [isUploading, setUploading] = useState(false);

    const defaultAvatarUrl = 'https://vmyzbnqvfwwmhoazveei.supabase.co/storage/v1/object/public/avatar/default/avatar.svg';

    async function handleFileChange(event:React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (!file || !user) return;

        setUploading(true);
        
        try {
        const fileName = `${user.id}/${Date.now()}-${file.name}`;

        const { error: uploadError } = await supabase.storage
            .from('avatar')
            .upload(fileName, file, {upsert: true});

        if (uploadError) {
            console.error(uploadError);
            alert (t("ErrorMsg.notAblePF"));
            setUploading(false);
            return;
        }

        const { data: urlData } = await supabase.storage
            .from('avatar')
            .getPublicUrl(fileName);

        const newAvatarUrl = urlData?.publicUrl;

        const { error: updateError } = await supabase
            .from('profiles')
            .update({ avatar_url: newAvatarUrl })
            .eq('id', user.id);

            if (updateError) {
                console.error(updateError);
                alert (t("ErrorMsg.notAbleUpdate"));
                setUploading(false);
                return;
            }

            window.location.reload();

        } catch (error) {
            console.error(error);
            alert (t("ErrorMsg.SomethingWentWrong"));
            setUploading(false);
            return;
        } finally {
            setUploading(false);}

    }
        
    return (
        <div className="flex flex-col items-center">
      <label className="cursor-pointer">
        <img
          src={profile?.avatar_url || defaultAvatarUrl}
          alt="Profile billede"
          className="w-40 h-40 rounded-full object-cover border border-gray-300 bg-white"
        />

        {/* Skjult file input */}
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </label>

      {isUploading && (
        <p className="text-sm text-gray-500 mt-2">Uploader...</p>
      )}
    </div>
    );
};

export default ProfilePicture;