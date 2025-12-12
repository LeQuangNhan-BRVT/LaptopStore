import { PassportStrategy } from "@nestjs/passport";
import { Strategy, VerifyCallback, StrategyOptions } from "passport-google-oauth20";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google'){
    constructor(private configService: ConfigService) {
        super({
            clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
            clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
            callbackURL: 'http://localhost:3000/auth/google/callback',
            scope: ['email', 'profile'],
        } as StrategyOptions);
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: VerifyCallback,
    ): Promise<any> {
        const user = {
            email: profile?.emails?.[0]?.value ?? null,
            full_name: profile?.displayName ?? null,
            provider: 'google',
            provider_id: profile?.id ?? null,
        };
        return done(null, user);
    }
}



