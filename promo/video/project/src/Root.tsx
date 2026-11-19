import React from 'react';
import {Composition, Still} from 'remotion';
import {TukiAnnouncement, TOTAL_SEC} from './Video';
import {Thumbnail} from './Thumbnail';
import {TukiFilm, FILM_SEC} from './Film';
import {TukiCombo, COMBO_SEC} from './Combo';

export const Root: React.FC = () => (
  <>
    <Composition id="TukiAnnouncement" component={TukiAnnouncement} durationInFrames={TOTAL_SEC * 30} fps={30} width={1920} height={1080} />
    <Composition id="TukiFilm" component={TukiFilm} durationInFrames={FILM_SEC * 30} fps={30} width={1920} height={1080} />
    <Composition id="TukiCombo" component={TukiCombo} durationInFrames={COMBO_SEC * 30} fps={30} width={1920} height={1080} />
    <Still id="Thumbnail" component={Thumbnail} width={1920} height={1080} />
  </>
);
