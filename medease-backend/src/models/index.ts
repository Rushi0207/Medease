import { Pool } from 'pg';
import { UserModel } from './User';
import { PatientModel } from './Patient';
import { DoctorModel } from './Doctor';
import { HealthMetricsModel } from './HealthMetrics';
import { MedicalConditionModel } from './MedicalCondition';
import { AppointmentModel } from './Appointment';
import { ChatRoomModel, MessageModel } from './ChatRoom';
import { DocumentModel } from './Document';

export class Models {
  public user: UserModel;
  public patient: PatientModel;
  public doctor: DoctorModel;
  public healthMetrics: HealthMetricsModel;
  public medicalCondition: MedicalConditionModel;
  public appointment: AppointmentModel;
  public chatRoom: ChatRoomModel;
  public message: MessageModel;
  public document: DocumentModel;

  constructor(pool: Pool) {
    this.user = new UserModel(pool);
    this.patient = new PatientModel(pool);
    this.doctor = new DoctorModel(pool);
    this.healthMetrics = new HealthMetricsModel(pool);
    this.medicalCondition = new MedicalConditionModel(pool);
    this.appointment = new AppointmentModel(pool);
    this.chatRoom = new ChatRoomModel(pool);
    this.message = new MessageModel(pool);
    this.document = new DocumentModel(pool);
  }
}

export {
  UserModel,
  PatientModel,
  DoctorModel,
  HealthMetricsModel,
  MedicalConditionModel,
  AppointmentModel,
  ChatRoomModel,
  MessageModel,
  DocumentModel,
};