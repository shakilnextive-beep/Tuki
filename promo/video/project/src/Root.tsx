import React from 'react';
import {Composition, Still} from 'remotion';
import {TukiAnnouncement, TOTAL_SEC} from './Video';
import {Thumbnail} from './Thumbnail';
import {ThumbWinMac} from './ThumbWinMac';
import {TukiFilm, FILM_SEC} from './Film';
import {TukiCombo, COMBO_SEC} from './Combo';
import {TukiWinVsMac, WINMAC_SEC} from './WinVsMac';
import {TukiWinVsMac30, WINMAC30_SEC} from './WinVsMac30';

export const Root: React.FC = () => (
  <>
    <Composition id="TukiAnnouncement" component={TukiAnnouncement} durationInFrames={TOTAL_SEC * 30} fps={30} width={1920} height={1080} />
    <Composition id="TukiFilm" component={TukiFilm} durationInFrames={FILM_SEC * 30} fps={30} width={1920} height={1080} />
    <Composition id="TukiCombo" component={TukiCombo} durationInFrames={COMBO_SEC * 30} fps={30} width={1920} height={1080} />
    <Composition id="TukiWinVsMac" component={TukiWinVsMac} durationInFrames={WINMAC_SEC * 30} fps={30} width={1920} height={1080} />
    <Composition id="TukiWinVsMac30" component={TukiWinVsMac30} durationInFrames={Math.round(WINMAC30_SEC * 30)} fps={30} width={1920} height={1080} />
    <Still id="ThumbWinMac" component={ThumbWinMac} width={1920} height={1080} />
    <Still id="Thumbnail" component={Thumbnail} width={1920} height={1080} />
  </>
);
